import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Brain, Sparkles, Zap, Star, Hexagon, Triangle, Circle, Square, ChevronUp, ChevronDown, Send, Trash2, Edit, Plus, X, MoreVertical, Loader, Globe, Check } from 'lucide-react';
import { NavBar } from './NavBar';
import { UserPortfolio } from '../lib/database';
import { supabase } from '../lib/supabase';
import { LoadingScreen } from './LoadingScreen';
import axios from 'axios';
import { lingoService } from '../lib/lingo';

interface NeuroNushkaProps {
  onBack: () => void;
  portfolio?: UserPortfolio | null;
}

interface ChatSession {
  id: string;
  title: string;
  lastUpdated: Date;
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  language?: string;
}

// Supported languages
const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' }
];

export const NeuroNushka: React.FC<NeuroNushkaProps> = ({ onBack, portfolio }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const shouldScrollRef = useRef<boolean>(true);
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [typingText, setTypingText] = useState('');
  const [fullText, setFullText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const typingIndexRef = useRef(0);
  const typingSpeedRef = useRef(5); // Increased typing speed (was 10)

  // Get current user ID on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Load chat sessions when userId is available
  useEffect(() => {
    if (userId) {
      loadChatSessions();
    }
  }, [userId]);

  // Auto-scroll to bottom of chat when user sends a message
  useEffect(() => {
    if (chatContainerRef.current && shouldScrollRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Loading animation steps
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % 3);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  // Typing effect for AI responses
  useEffect(() => {
    if (isTyping && typingIndexRef.current < fullText.length) {
      const timeout = setTimeout(() => {
        setTypingText(fullText.substring(0, typingIndexRef.current + 1));
        typingIndexRef.current += 1;
      }, typingSpeedRef.current);
      
      return () => clearTimeout(timeout);
    } else if (isTyping && typingIndexRef.current >= fullText.length) {
      setIsTyping(false);
      
      // Add the complete message to the messages array
      const newMessage: Message = {
        id: Date.now().toString(),
        content: fullText,
        isUser: false,
        timestamp: new Date(),
        language: selectedLanguage.code
      };
      
      setMessages(prev => {
        // Remove the temporary typing message and add the complete one
        const filtered = prev.filter(msg => msg.id !== 'typing');
        return [...filtered, newMessage];
      });
    }
  }, [isTyping, typingText, fullText]);

  const loadChatSessions = async () => {
    if (!userId) return;
    
    try {
      setInitialLoading(true);
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error('Error loading chat sessions:', error);
        setInitialLoading(false);
        return;
      }
      
      if (data && data.length > 0) {
        const sessions = data.map(chat => ({
          id: chat.id,
          title: chat.title,
          lastUpdated: new Date(chat.updated_at)
        }));
        setChatSessions(sessions);
        
        // Set the most recent chat as active
        setActiveChatId(sessions[0].id);
        loadMessages(sessions[0].id);
      } else {
        // Create a new chat if none exists
        createNewChat();
      }
      setInitialLoading(false);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      setInitialLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error loading messages:', error);
        setMessages([]);
        return;
      }
      
      if (data) {
        // First load messages with original content
        const formattedMessages = data.map(msg => ({
          id: msg.id,
          content: msg.content,
          isUser: msg.is_user,
          timestamp: new Date(msg.created_at),
          language: msg.is_user ? msg.lang : 'en'
        }));
        
        setMessages(formattedMessages);
        shouldScrollRef.current = true;
        
        // Then translate if needed
        if (selectedLanguage.code !== 'en' && lingoService.isInitialized()) {
          setIsTranslating(true);
          
          // Translate non-user messages
          const translatedMessages = await Promise.all(
            formattedMessages.map(async (msg) => {
              if (!msg.isUser && msg.language === 'en') {
                try {
                  const translatedContent = await lingoService.translateText(
                    msg.content, 
                    'en', 
                    selectedLanguage.code
                  );
                  return {
                    ...msg,
                    content: translatedContent,
                    language: selectedLanguage.code
                  };
                } catch (error) {
                  console.error('Translation error for message:', msg.id, error);
                  return msg;
                }
              }
              return msg;
            })
          );
          
          setMessages(translatedMessages);
          setIsTranslating(false);
        }
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const createNewChat = async () => {
    if (!userId) return;
    
    try {
      const newChatTitle = `New Chat ${chatSessions.length + 1}`;
      const { data, error } = await supabase
        .from('chats')
        .insert({
          user_id: userId,
          title: newChatTitle,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        console.error('Error creating new chat:', error);
        return;
      }
      
      if (data && data.length > 0) {
        const newChat = {
          id: data[0].id,
          title: data[0].title,
          lastUpdated: new Date(data[0].updated_at)
        };
        
        setChatSessions(prev => [newChat, ...prev]);
        setActiveChatId(newChat.id);
        setMessages([]);
        shouldScrollRef.current = true;
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const renameChat = async (chatId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('chats')
        .update({ title: newTitle })
        .eq('id', chatId);
      
      if (error) {
        console.error('Error renaming chat:', error);
        return;
      }
      
      setChatSessions(prev => 
        prev.map(chat => 
          chat.id === chatId 
            ? { ...chat, title: newTitle } 
            : chat
        )
      );
      setRenamingChatId(null);
    } catch (error) {
      console.error('Error renaming chat:', error);
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      // Delete all messages in the chat
      await supabase
        .from('messages')
        .delete()
        .eq('chat_id', chatId);
      
      // Delete the chat
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);
      
      if (error) {
        console.error('Error deleting chat:', error);
        return;
      }
      
      setChatSessions(prev => prev.filter(chat => chat.id !== chatId));
      setShowDeleteConfirm(null);
      
      // If the deleted chat was active, set another chat as active or create a new one
      if (activeChatId === chatId) {
        const remainingChats = chatSessions.filter(chat => chat.id !== chatId);
        if (remainingChats.length > 0) {
          setActiveChatId(remainingChats[0].id);
          loadMessages(remainingChats[0].id);
        } else {
          createNewChat();
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const fetchDappierData = async (userQuery: string) => {
    try {
      const apiKey = "ak_01jxyw0xa6e8v8tyzh7e2pky4d";
      const endpoint = "https://api.dappier.com/app/aimodel/am_01j06ytn18ejftedz6dyhz2b15";

      const defaultPrompt = `
You are a highly experienced stock market analyst.
Whenever a user asks a query, provide a structured, data-driven, and detailed answer.
Include insights across technical indicators (RSI, MACD, SMA), fundamental metrics (P/E, EPS, revenue),
recent stock news, market trends, potential risks, and historical performance.
Avoid giving personal financial advice. Focus on clarity, relevance, and completeness.

User Query: ${userQuery}`;

      const body = {
        query: defaultPrompt,
      };

      const response = await axios.post(endpoint, body, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 60000, // 60 seconds timeout
      });

      return response.data.message || "I couldn't generate a response. Please try again.";
    } catch (error) {
      console.error("Error fetching Dappier data:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Response error:", error.response.data);
      }
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !activeChatId || !userId) return;
    
    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Add user message to UI immediately
    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: userMessage,
      isUser: true,
      timestamp: new Date(),
      language: selectedLanguage.code
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    shouldScrollRef.current = true;
    
    // Force scroll to bottom after user message
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
    
    // Save user message to database
    try {
      let englishMessage = userMessage;
      
      // Translate user message to English if needed
      if (selectedLanguage.code !== 'en' && lingoService.isInitialized()) {
        try {
          console.log('Translating user message to English...');
          
          const translatedToEnglish = await lingoService.translateText(userMessage, selectedLanguage.code, 'en');
          
          if (translatedToEnglish && translatedToEnglish.trim()) {
            englishMessage = translatedToEnglish;
            console.log('User message translated to English successfully');
          }
        } catch (error) {
          console.error('Error translating user message to English:', error);
          // Continue with original message
        }
      }
      
      // Save message to database with English version
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          chat_id: activeChatId,
          content: englishMessage, // Store English version
          is_user: true,
          lang: selectedLanguage.code, // Store original language
          created_at: new Date().toISOString()
        });
      
      if (msgError) {
        console.error('Error saving user message:', msgError);
      }
      
      // Update chat's last updated timestamp
      const { error: chatError } = await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeChatId);
      
      if (chatError) {
        console.error('Error updating chat timestamp:', chatError);
      }
      
      // Start loading animation
      setIsLoading(true);
      
      // Force scroll to bottom to show loading animation
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
      
      // Fetch AI response
      let aiResponse;
      try {
        aiResponse = await fetchDappierData(englishMessage);
      } catch (error) {
        console.error('Error fetching AI response:', error);
        aiResponse = "I'm sorry, I encountered an error while processing your request. Please try again later.";
      }
      
      // Format the response to handle newlines properly
      const formattedResponse = aiResponse.replace(/\\n/g, '\n');
      
      // Translate AI response if needed
      let translatedResponse = formattedResponse;
      if (selectedLanguage.code !== 'en' && lingoService.isInitialized()) {
        try {
          setIsTranslating(true);
          const translatedText = await lingoService.translateText(formattedResponse, 'en', selectedLanguage.code);
          if (translatedText) {
            translatedResponse = translatedText;
          }
          setIsTranslating(false);
        } catch (error) {
          console.error('Error translating response:', error);
          translatedResponse = formattedResponse;
          setIsTranslating(false);
        }
      }
      
      setIsLoading(false);
      
      // Set up typing effect
      setFullText(translatedResponse);
      typingIndexRef.current = 0;
      setTypingText('');
      setIsTyping(true);
      
      // Add temporary typing message
      setMessages(prev => [...prev, {
        id: 'typing',
        content: '',
        isUser: false,
        timestamp: new Date()
      }]);
      
      // Force scroll to bottom to show typing indicator
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
      
      shouldScrollRef.current = false;
      
      // Save AI response to database (in English)
      const { error: aiMsgError } = await supabase
        .from('messages')
        .insert({
          chat_id: activeChatId,
          content: formattedResponse, // Store original English response
          is_user: false,
          lang: 'en',
          created_at: new Date().toISOString()
        });
      
      if (aiMsgError) {
        console.error('Error saving AI message:', aiMsgError);
      }
      
      // Update chat's last updated timestamp again
      const { error: chatError2 } = await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeChatId);
      
      if (chatError2) {
        console.error('Error updating chat timestamp:', chatError2);
      }
      
      // Update chat sessions list to reflect new timestamp
      setChatSessions(prev => 
        prev.map(chat => 
          chat.id === activeChatId 
            ? { ...chat, lastUpdated: new Date() } 
            : chat
        ).sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
      );
      
    } catch (error) {
      console.error('Error processing message:', error);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date >= today) {
      return 'Today';
    } else if (date >= yesterday) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getLoadingMessage = () => {
    switch (loadingStep) {
      case 0:
        return "📡 Connecting to data sources...";
      case 1:
        return "📊 Processing market indicators...";
      case 2:
        return "🧠 Generating insights...";
      default:
        return "🔍 Analyzing market trends...";
    }
  };

  // When language changes, reload messages with the new language
  useEffect(() => {
    if (activeChatId) {
      loadMessages(activeChatId);
    }
  }, [selectedLanguage]);

  if (initialLoading) {
    return <LoadingScreen message="Loading NeuroNushka..." subMessage="Preparing your AI stock analyst" />;
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen relative overflow-hidden"
      style={{
        background: `
          linear-gradient(135deg, #131720 0%, #0D1117 50%, #131720 100%),
          radial-gradient(ellipse at center, rgba(255, 255, 255, 0.02) 0%, transparent 70%)
        `,
        backgroundAttachment: 'fixed'
      }}
    >
      {/* NavBar Component */}
      <NavBar 
        currentPage="ai"
        onNavigate={(page) => {
          if (page === 'dashboard') {
            onBack();
          } else{
            onBack();
          }
        }}
        portfolio={portfolio}
      />

      {/* Fixed Background Objects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Glowing Orbs */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`orb-${i}`}
            className="fixed"
            style={{
              left: `${20 + i * 8}%`,
              top: `${15 + i * 7}%`
            }}
          >
            <div 
              className="glowing-orb"
              style={{
                width: `${8 + Math.random() * 16}px`,
                height: `${8 + Math.random() * 16}px`,
                background: `radial-gradient(circle, 
                  rgba(${i % 3 === 0 ? '255, 140, 0' : i % 3 === 1 ? '255, 165, 0' : '255, 120, 0'}, 0.8) 0%, 
                  rgba(${i % 3 === 0 ? '255, 140, 0' : i % 3 === 1 ? '255, 165, 0' : '255, 120, 0'}, 0.3) 50%,
                  transparent 100%)`,
                borderRadius: '50%',
                filter: `blur(${1 + Math.random() * 2}px)`,
                boxShadow: `
                  0 0 ${12 + Math.random() * 16}px rgba(${i % 3 === 0 ? '255, 140, 0' : i % 3 === 1 ? '255, 165, 0' : '255, 120, 0'}, 0.6),
                  0 0 ${20 + Math.random() * 24}px rgba(${i % 3 === 0 ? '255, 140, 0' : i % 3 === 1 ? '255, 165, 0' : '255, 120, 0'}, 0.3)
                `,
                animation: `orb-pulse ${3 + Math.random() * 4}s ease-in-out infinite`
              }}
            />
          </div>
        ))}

        {/* Floating Shapes */}
        {[...Array(12)].map((_, i) => {
          const shapes = [Hexagon, Triangle, Circle, Square];
          const ShapeComponent = shapes[i % shapes.length];
          return (
            <div
              key={`shape-${i}`}
              className="fixed"
              style={{
                left: `${10 + i * 7}%`,
                top: `${12 + i * 6}%`,
                opacity: 0.15,
                transform: `rotate(${i * 30}deg)`
              }}
            >
              <ShapeComponent 
                className={`w-${4 + (i % 4) * 2} h-${4 + (i % 4) * 2} text-${
                  i % 3 === 0 ? 'orange' : i % 3 === 1 ? 'amber' : 'yellow'
                }-400`}
              />
            </div>
          );
        })}

        {/* Subtle Grid */}
        <div 
          className="fixed inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 140, 0, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 140, 0, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        ></div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-7">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-8 flex items-center px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to AI Assistants
        </button>

        {/* Chat Interface */}
        <div className="flex h-[calc(100vh-200px)] rounded-xl overflow-hidden">
          {/* Sidebar */}
          <div 
            className={`bg-black/30 backdrop-blur-xl border-r border-white/10 transition-all duration-300 ${
              sidebarCollapsed ? 'w-0 opacity-0' : 'w-72 opacity-100'
            }`}
          >
            {!sidebarCollapsed && (
              <div className="h-full flex flex-col">
                {/* Sidebar Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                  <h2 className="text-white font-bold flex items-center">
                    <Brain className="w-5 h-5 text-orange-400 mr-2" />
                    Chat History
                  </h2>
                  <button 
                    onClick={createNewChat}
                    className="p-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Chat List */}
                <div className="flex-1 overflow-y-auto">
                  {chatSessions.length === 0 ? (
                    <div className="p-4 text-center text-gray-400">
                      <p>No chats yet</p>
                      <button 
                        onClick={createNewChat}
                        className="mt-2 px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors"
                      >
                        New Chat
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {chatSessions.map(chat => (
                        <div 
                          key={chat.id} 
                          className={`p-3 cursor-pointer transition-colors ${
                            activeChatId === chat.id ? 'bg-orange-500/20' : 'hover:bg-white/5'
                          }`}
                        >
                          {renamingChatId === chat.id ? (
                            <div className="flex items-center">
                              <input
                                type="text"
                                value={newChatTitle}
                                onChange={(e) => setNewChatTitle(e.target.value)}
                                className="flex-1 bg-black/30 border border-orange-500/30 rounded px-2 py-1 text-white text-sm"
                                autoFocus
                                onBlur={() => {
                                  if (newChatTitle.trim()) {
                                    renameChat(chat.id, newChatTitle);
                                  } else {
                                    setRenamingChatId(null);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && newChatTitle.trim()) {
                                    renameChat(chat.id, newChatTitle);
                                  } else if (e.key === 'Escape') {
                                    setRenamingChatId(null);
                                  }
                                }}
                              />
                              <button 
                                onClick={() => {
                                  if (newChatTitle.trim()) {
                                    renameChat(chat.id, newChatTitle);
                                  } else {
                                    setRenamingChatId(null);
                                  }
                                }}
                                className="ml-2 p-1 text-green-400 hover:bg-green-500/20 rounded"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setRenamingChatId(null)}
                                className="ml-1 p-1 text-red-400 hover:bg-red-500/20 rounded"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div 
                              onClick={() => {
                                if (activeChatId !== chat.id) {
                                  setActiveChatId(chat.id);
                                  loadMessages(chat.id);
                                }
                              }}
                              className="flex items-center justify-between group"
                            >
                              <div className="flex-1 truncate">
                                <div className="text-white font-medium truncate">{chat.title}</div>
                                <div className="text-gray-400 text-xs">{formatDate(chat.lastUpdated)}</div>
                              </div>
                              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRenamingChatId(chat.id);
                                    setNewChatTitle(chat.title);
                                  }}
                                  className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDeleteConfirm(chat.id);
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              
                              {/* Delete Confirmation */}
                              {showDeleteConfirm === chat.id && (
                                <div 
                                  className="absolute right-0 mt-8 bg-gray-900 border border-red-500/30 rounded-lg shadow-xl p-3 z-10"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <p className="text-white text-sm mb-2">Delete this chat?</p>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => deleteChat(chat.id)}
                                      className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 text-xs"
                                    >
                                      Delete
                                    </button>
                                    <button
                                      onClick={() => setShowDeleteConfirm(null)}
                                      className="px-3 py-1 bg-gray-700/50 text-gray-300 rounded hover:bg-gray-700 text-xs"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-black/20 backdrop-blur-xl">
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg mr-2"
                >
                  {sidebarCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                </button>
                <h2 className="text-white font-bold">
                  {chatSessions.find(chat => chat.id === activeChatId)?.title || 'New Chat'}
                </h2>
              </div>
              
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 bg-black/30 rounded-lg border border-white/10 text-white hover:bg-black/40 transition-colors"
                >
                  <Globe className="w-4 h-4 text-orange-400" />
                  <span>{selectedLanguage.flag}</span>
                  <span>{selectedLanguage.name}</span>
                </button>
                
                {showLanguageDropdown && (
                  <div className="absolute right-0 mt-2 bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl z-10">
                    {languages.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setSelectedLanguage(lang);
                          setShowLanguageDropdown(false);
                        }}
                        className={`flex items-center w-full px-4 py-2 text-left hover:bg-white/10 transition-colors ${
                          selectedLanguage.code === lang.code ? 'bg-orange-500/20 text-orange-400' : 'text-white'
                        }`}
                      >
                        <span className="mr-2">{lang.flag}</span>
                        <span>{lang.name}</span>
                        {selectedLanguage.code === lang.code && (
                          <Check className="w-4 h-4 ml-2" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Messages Container */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <Brain className="w-16 h-16 text-orange-400 mb-4 opacity-50" />
                  <h3 className="text-xl font-bold text-white mb-2">Welcome to NeuroNushka</h3>
                  <p className="text-gray-400 max-w-md mb-6">
                    Your AI-powered stock market analyst. Ask me anything about stocks, market trends, or investment strategies.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
                    {[
                      "What's your analysis of Tesla stock?",
                      "How is the tech sector performing?",
                      "Explain RSI indicator for beginners",
                      "Compare Apple and Microsoft stocks"
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInputMessage(suggestion);
                          if (inputRef.current) {
                            inputRef.current.focus();
                          }
                        }}
                        className="px-4 py-3 bg-orange-500/10 border border-orange-500/30 rounded-xl text-orange-400 hover:bg-orange-500/20 transition-colors text-left"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    message.id === 'typing' ? (
                      <div
                        key="typing-message"
                        className="flex justify-start"
                      >
                        <div className="max-w-[80%] rounded-2xl p-4 bg-black/40 text-white border border-orange-500/30">
                          <div className="flex items-start mb-2">
                            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center mr-2">
                              <Brain className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                              <div className="font-medium text-orange-400">NeuroNushka</div>
                              <div className="text-xs text-gray-400">
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                          <div className="whitespace-pre-wrap">
                            {typingText}
                            <span className="inline-block w-2 h-4 bg-orange-400 ml-1 animate-blink"></span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={message.id}
                        className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[80%] rounded-2xl p-4 ${
                            message.isUser 
                              ? 'bg-blue-600/30 text-white' 
                              : 'bg-black/40 text-white border border-orange-500/30'
                          }`}
                        >
                          <div className="flex items-start mb-2">
                            {!message.isUser && (
                              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center mr-2">
                                <Brain className="w-5 h-5 text-orange-400" />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className={`font-medium ${message.isUser ? 'text-blue-300' : 'text-orange-400'}`}>
                                {message.isUser ? 'You' : 'NeuroNushka'}
                              </div>
                              <div className="text-xs text-gray-400">
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {message.language && message.language !== 'en' && (
                                  <span className="ml-2 bg-gray-800 px-1.5 py-0.5 rounded text-xs">
                                    {languages.find(l => l.code === message.language)?.flag || '🌐'}
                                  </span>
                                )}
                              </div>
                            </div>
                            {message.isUser && (
                              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center ml-2">
                                <User className="w-5 h-5 text-blue-400" />
                              </div>
                            )}
                          </div>
                          <div className="whitespace-pre-wrap">
                            {message.content}
                          </div>
                        </div>
                      </div>
                    )
                  ))}
                  
                  {/* Loading Animation */}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-2xl p-4 bg-black/40 text-white border border-orange-500/30">
                        <div className="flex items-start mb-2">
                          <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center mr-2">
                            <Brain className="w-5 h-5 text-orange-400" />
                          </div>
                          <div>
                            <div className="font-medium text-orange-400">NeuroNushka</div>
                            <div className="text-xs text-gray-400">Thinking...</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {/* 3D Rotating Cube */}
                          <div className="cube-container">
                            <div className="cube">
                              <div className="cube-face front"></div>
                              <div className="cube-face back"></div>
                              <div className="cube-face right"></div>
                              <div className="cube-face left"></div>
                              <div className="cube-face top"></div>
                              <div className="cube-face bottom"></div>
                            </div>
                          </div>
                          <div className="text-gray-300">{getLoadingMessage()}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Translation Loading Animation */}
                  {isTranslating && (
                    <div className="flex justify-center">
                      <div className="max-w-[80%] rounded-2xl p-4 bg-black/40 text-white border border-orange-500/30">
                        <div className="flex items-center space-x-3">
                          <div className="translation-sphere-container">
                            <div className="translation-sphere">
                              <div className="translation-orbit">
                                <div className="translation-satellite"></div>
                              </div>
                              <div className="translation-orbit" style={{ animationDelay: '0.5s', transform: 'rotate(60deg)' }}>
                                <div className="translation-satellite"></div>
                              </div>
                              <div className="translation-orbit" style={{ animationDelay: '1s', transform: 'rotate(120deg)' }}>
                                <div className="translation-satellite"></div>
                              </div>
                            </div>
                          </div>
                          <div className="text-gray-300">Translating to {selectedLanguage.name}...</div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Input Area */}
            <div className="p-4 border-t border-white/10">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about stocks, market trends, or investment strategies..."
                  className="w-full bg-black/30 border border-white/20 rounded-xl py-3 px-4 pr-12 text-white placeholder-gray-500 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 resize-none"
                  rows={2}
                  disabled={isLoading || isTyping || isTranslating}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading || isTyping || isTranslating}
                  className="absolute right-3 bottom-6 p-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500 flex justify-between">
                <div>Press Enter to send, Shift+Enter for new line</div>
                <div>Powered by NeuroNushka AI</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Background Animation Styles */}
      <style jsx>{`
        @keyframes orb-pulse {
          0%, 100% { 
            transform: scale(1); 
            opacity: 0.6;
          }
          50% { 
            transform: scale(1.4); 
            opacity: 1;
          }
        }

        .glowing-orb {
          will-change: transform, opacity;
          backface-visibility: hidden;
          animation: orb-pulse 4s ease-in-out infinite;
        }

        /* 3D Cube Animation */
        .cube-container {
          width: 30px;
          height: 30px;
          perspective: 600px;
        }

        .cube {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          animation: cube-rotate 3s infinite linear;
        }

        .cube-face {
          position: absolute;
          width: 100%;
          height: 100%;
          background: rgba(255, 140, 0, 0.2);
          border: 1px solid rgba(255, 140, 0, 0.4);
          box-shadow: 0 0 10px rgba(255, 140, 0, 0.2);
        }

        .front  { transform: rotateY(0deg) translateZ(15px); }
        .back   { transform: rotateY(180deg) translateZ(15px); }
        .right  { transform: rotateY(90deg) translateZ(15px); }
        .left   { transform: rotateY(-90deg) translateZ(15px); }
        .top    { transform: rotateX(90deg) translateZ(15px); }
        .bottom { transform: rotateX(-90deg) translateZ(15px); }

        @keyframes cube-rotate {
          0% { transform: rotateX(0deg) rotateY(0deg); }
          100% { transform: rotateX(360deg) rotateY(360deg); }
        }

        /* Translation Animation */
        .translation-sphere-container {
          width: 30px;
          height: 30px;
          perspective: 600px;
        }

        .translation-sphere {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          animation: sphere-pulse 2s infinite ease-in-out;
        }

        .translation-orbit {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 1px solid rgba(255, 140, 0, 0.3);
          border-radius: 50%;
          transform-style: preserve-3d;
          animation: orbit-rotate 4s infinite linear;
        }

        .translation-satellite {
          position: absolute;
          width: 6px;
          height: 6px;
          background: rgba(255, 140, 0, 0.8);
          border-radius: 50%;
          top: -3px;
          left: calc(50% - 3px);
          box-shadow: 0 0 8px rgba(255, 140, 0, 0.6);
        }

        @keyframes sphere-pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
        }

        @keyframes orbit-rotate {
          0% { transform: rotateX(80deg) rotateY(0deg); }
          100% { transform: rotateX(80deg) rotateY(360deg); }
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .animate-blink {
          animation: blink 1s step-end infinite;
        }

        /* Ensure fixed background attachment works properly */
        body {
          background-attachment: fixed;
        }
      `}</style>
    </div>
  );
};

// User avatar component
const User: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
};