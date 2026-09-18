import React, { useState, useEffect } from 'react';
import { Rocket } from 'lucide-react';
import { CatProfile, Post, Story, NotificationItem } from './types';
import {
  getStoredProfiles,
  saveProfiles,
  getStoredPosts,
  savePosts,
  getStoredStories,
  saveStories,
  getStoredNotifications,
  saveNotifications,
  getActiveProfileId,
  setActiveProfileId,
} from './utils/storage';
import { INITIAL_DOG_PROFILES, INITIAL_DOG_POSTS, INITIAL_DOG_STORIES, INITIAL_DOG_NOTIFICATIONS } from './data/mockData';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { StoriesBar } from './components/StoriesBar';
import { StoryViewerModal } from './components/StoryViewerModal';
import { PostCard } from './components/PostCard';
import { PostLightbox } from './components/PostLightbox';
import { CreatePostModal } from './components/CreatePostModal';
import { CreateCatProfileModal } from './components/CreateCatProfileModal';
import { ExploreView } from './components/ExploreView';
import { MeowTranslatorModal } from './components/MeowTranslatorModal';
import { CatAnalyzerModal } from './components/CatAnalyzerModal';
import { ProfileView } from './components/ProfileView';
import { NotificationsModal } from './components/NotificationsModal';
import { AffiliateMarketplaceModal } from './components/AffiliateMarketplaceModal';
import { SocialAuthModal } from './components/SocialAuthModal';
import { SocialShareModal } from './components/SocialShareModal';
import { DeploymentRoadmapModal } from './components/DeploymentRoadmapModal';
import { ClerkAuthGate } from './components/ClerkAuthGate';
import { useUser } from '@clerk/clerk-react';
import { SoundboardModal } from './components/SoundboardModal';
import { LiveFilterCamera } from './components/LiveFilterCamera';
import { useLocation, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import ProfilePage from './pages/ProfilePage';
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import { RightSidebar } from './components/ui/RightSidebar';
import { AUTO_OPEN_CREATE_FLAG } from './components/feed/PostComposer';

// Determine which brand (cat/dog) to open the app in. Reads the `?app=`
// param set by the Pawprint Network landing page (public/pawprint_landing.html)
// so "Join The Catwalk" / "Join The Dog Park" actually land in the right
// experience, instead of always defaulting to cat. Falls back to hostname
// (instawoof.app → dog) for direct /app visits with no param.
function getInitialSpeciesMode(): 'cat' | 'dog' {
  if (typeof window === 'undefined') return 'cat';

  const params = new URLSearchParams(window.location.search);
  const appParam = params.get('app');
  if (appParam === 'cat' || appParam === 'dog') return appParam;

  const host = window.location.hostname.toLowerCase();
  if (host.includes('instawoof')) return 'dog';

  return 'cat';
}

export default function RichApp() {
  const { user } = useUser();
  const ownerId = user?.id || 'signed-out';
  const location = useLocation();
  const navigate = useNavigate();
  const [speciesMode, setSpeciesMode] = useState<'cat' | 'dog'>(getInitialSpeciesMode);

  const [profiles, setProfiles] = useState<CatProfile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<string>('cat_1');

  // Species cache states
  const [catProfiles, setCatProfiles] = useState<CatProfile[]>([]);
  const [catPosts, setCatPosts] = useState<Post[]>([]);
  const [catStories, setCatStories] = useState<Story[]>([]);
  const [catNotifs, setCatNotifs] = useState<NotificationItem[]>([]);

  const [dogProfiles, setDogProfiles] = useState<CatProfile[]>([]);
  const [dogPosts, setDogPosts] = useState<Post[]>([]);
  const [dogStories, setDogStories] = useState<Story[]>([]);
  const [dogNotifs, setDogNotifs] = useState<NotificationItem[]>([]);

  const [activeTab, setActiveTab] = useState<string>('feed');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isCreateProfileModalOpen, setIsCreateProfileModalOpen] = useState<boolean>(false);
  const [isTranslatorModalOpen, setIsTranslatorModalOpen] = useState<boolean>(false);
  const [lightboxPost, setLightboxPost] = useState<Post | null>(null);
  const [isAnalyzerModalOpen, setIsAnalyzerModalOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isAffiliateModalOpen, setIsAffiliateModalOpen] = useState<boolean>(false);
  const [isSocialAuthModalOpen, setIsSocialAuthModalOpen] = useState<boolean>(false);
  const [isRoadmapModalOpen, setIsRoadmapModalOpen] = useState<boolean>(false);
  const [isSoundboardOpen, setIsSoundboardOpen] = useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | undefined>(undefined);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [sharePostTarget, setSharePostTarget] = useState<Post | null>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const route = tab === 'feed' ? '/' : `/${tab}`;
    if (location.pathname !== route) navigate(route);
  };

  const handleOpenGraphComposer = () => {
    try {
      sessionStorage.setItem(AUTO_OPEN_CREATE_FLAG, '1');
    } catch {
      // The feed still works when sessionStorage is unavailable.
    }
    handleTabChange('feed');
  };

  useEffect(() => {
    const firstSegment = location.pathname.split('/').filter(Boolean)[0];
    if (firstSegment === 'profile') setActiveTab('profile');
    else if (['explore', 'messages', 'notifications', 'saved'].includes(firstSegment)) {
      setActiveTab(firstSegment);
    } else {
      setActiveTab('feed');
    }
  }, [location.pathname]);

  // Initialize data on mount
  useEffect(() => {
    const loadedCatProfiles = getStoredProfiles(ownerId, 'cat');
    const loadedCatPosts = getStoredPosts(ownerId, 'cat');
    const loadedCatStories = getStoredStories(ownerId, 'cat');
    const loadedCatNotifs = getStoredNotifications(ownerId, 'cat');
    const loadedCatActiveId = getActiveProfileId(ownerId, 'cat');

    const loadedDogProfiles = getStoredProfiles(ownerId, 'dog');
    const loadedDogPosts = getStoredPosts(ownerId, 'dog');
    const loadedDogStories = getStoredStories(ownerId, 'dog');
    const loadedDogNotifs = getStoredNotifications(ownerId, 'dog');

    setCatProfiles(loadedCatProfiles);
    setCatPosts(loadedCatPosts);
    setCatStories(loadedCatStories);
    setCatNotifs(loadedCatNotifs);

    setDogProfiles(loadedDogProfiles);
    setDogPosts(loadedDogPosts);
    setDogStories(loadedDogStories);
    setDogNotifs(loadedDogNotifs);

    if (speciesMode === 'dog') {
      setProfiles(loadedDogProfiles.length ? loadedDogProfiles : INITIAL_DOG_PROFILES);
      setPosts(loadedDogPosts.length ? loadedDogPosts : INITIAL_DOG_POSTS);
      setStories(loadedDogStories.length ? loadedDogStories : INITIAL_DOG_STORIES);
      setNotifications(loadedDogNotifs.length ? loadedDogNotifs : INITIAL_DOG_NOTIFICATIONS);
      setActiveProfileIdState(getActiveProfileId(ownerId, 'dog') || 'dog_1');
    } else {
      setProfiles(loadedCatProfiles);
      setPosts(loadedCatPosts);
      setStories(loadedCatStories);
      setNotifications(loadedCatNotifs);
      setActiveProfileIdState(loadedCatActiveId);
    }

    // Clean the ?app= param from the address bar now that it's been read.
    if (window.location.search.includes('app=')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('app');
      window.history.replaceState({}, '', url.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId]);

  // Toggle brand theme on <html> element whenever platform switches
  useEffect(() => {
    const root = document.documentElement;
    if (speciesMode === 'dog') {
      root.classList.add('theme-dog');
    } else {
      root.classList.remove('theme-dog');
    }
  }, [speciesMode]);

  // Keep the browser tab title in sync with the active brand. The static
  // index.html always ships "The Catwalk" as a placeholder (it can't know
  // which domain it's on before JS runs), so this corrects it once we do.
  useEffect(() => {
    document.title =
      speciesMode === 'dog' ? 'The Dog Park • Pawprint Network' : 'The Catwalk • Pawprint Network';
  }, [speciesMode]);

  // Keep lightbox post in sync when treat/save state changes
  useEffect(() => {
    if (lightboxPost) {
      const updated = [...catPosts, ...dogPosts].find(p => p.id === lightboxPost.id);
      if (updated) setLightboxPost(updated);
    }
  }, [catPosts, dogPosts]);

  const handleToggleSpeciesMode = () => {
    if (speciesMode === 'cat') {
      // Save Cat state before switching
      saveProfiles(ownerId, profiles, 'cat');
      savePosts(ownerId, posts, 'cat');
      saveStories(ownerId, stories, 'cat');
      saveNotifications(ownerId, notifications, 'cat');
      setActiveProfileId(ownerId, activeProfileId, 'cat');

      setCatProfiles(profiles);
      setCatPosts(posts);
      setCatStories(stories);
      setCatNotifs(notifications);

      setSpeciesMode('dog');
      setProfiles(dogProfiles.length ? dogProfiles : INITIAL_DOG_PROFILES);
      setPosts(dogPosts.length ? dogPosts : INITIAL_DOG_POSTS);
      setStories(dogStories.length ? dogStories : INITIAL_DOG_STORIES);
      setNotifications(dogNotifs.length ? dogNotifs : INITIAL_DOG_NOTIFICATIONS);
      const activeDogId = getActiveProfileId(ownerId, 'dog');
      setActiveProfileIdState(activeDogId || 'dog_1');
    } else {
      // Save Dog state before switching
      saveProfiles(ownerId, profiles, 'dog');
      savePosts(ownerId, posts, 'dog');
      saveStories(ownerId, stories, 'dog');
      saveNotifications(ownerId, notifications, 'dog');
      setActiveProfileId(ownerId, activeProfileId, 'dog');

      setDogProfiles(profiles);
      setDogPosts(posts);
      setDogStories(stories);
      setDogNotifs(notifications);

      setSpeciesMode('cat');
      setProfiles(catProfiles);
      setPosts(catPosts);
      setStories(catStories);
      setNotifications(catNotifs);
      const activeCatId = getActiveProfileId(ownerId, 'cat');
      setActiveProfileIdState(activeCatId || 'cat_1');
    }
  };

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0] || {
    id: 'cat_1',
    handle: 'LordWhiskers',
    name: 'Sir Whiskers III',
    avatar: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&q=80',
    bio: 'Professional Sunbeam Snatcher',
    breed: 'British Shorthair',
    age: '3 years',
    location: 'The Living Room Couch',
    favoriteSpot: 'Top of Bookshelf',
    boxPreference: 'Medium Chewy Box',
    followersCount: 14200,
    followingCount: 38,
    treatsReceived: 89300,
    badges: [],
  };

  const handleSelectProfile = (profile: CatProfile) => {
    setActiveProfileIdState(profile.id);
    setActiveProfileId(ownerId, profile.id, speciesMode);
  };

  const handleCreateProfile = (profileData: Omit<CatProfile, 'id' | 'followersCount' | 'followingCount' | 'treatsReceived' | 'badges'>) => {
    const newProfile: CatProfile = {
      ...profileData,
      id: `cat_${Date.now()}`,
      followersCount: 1,
      followingCount: 12,
      treatsReceived: 25,
      badges: [
        {
          id: 'b_welcome',
          title: speciesMode === 'dog' ? 'The Dog Park Debut' : 'The Catwalk Debut',
          description: speciesMode === 'dog' ? 'Official dog profile submitted to The Dog Park by Pawprint Network!' : 'Official cat profile submitted to The Catwalk by Pawprint Network!',
          icon: '👑',
          unlockedAt: 'Just now',
        },
      ],
    };

    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    saveProfiles(ownerId, updatedProfiles, speciesMode);

    // Auto-switch to newly created profile
    setActiveProfileIdState(newProfile.id);
    setActiveProfileId(ownerId, newProfile.id, speciesMode);

    // Add notification
    const newNotif: NotificationItem = {
      id: `n_${Date.now()}`,
      actorHandle: newProfile.handle,
      actorName: newProfile.name,
      actorAvatar: newProfile.avatar,
      type: 'follow',
      text: `Welcome @${newProfile.handle} to ${speciesMode === 'dog' ? 'The Dog Park' : 'The Catwalk'}! Your profile is live.`,
      timestamp: 'Just now',
      isRead: false,
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);
    saveNotifications(ownerId, updatedNotifs, speciesMode);
  };

  const handleUpdateSocialLinked = (platform: string) => {
    const updatedProfiles = profiles.map((p) => {
      if (p.id === activeProfile.id) {
        return {
          ...p,
          socialLinked: platform,
          isVerified: true,
        };
      }
      return p;
    });
    setProfiles(updatedProfiles);
    saveProfiles(ownerId, updatedProfiles, speciesMode);
  };

  const handleTreatPost = (postId: string) => {
    const updatedPosts = posts.map((p) => {
      if (p.id === postId) {
        const nextTreating = !p.isTreating;
        return {
          ...p,
          isTreating: nextTreating,
          treatsCount: nextTreating ? p.treatsCount + 1 : Math.max(0, p.treatsCount - 1),
        };
      }
      return p;
    });

    setPosts(updatedPosts);
    savePosts(ownerId, updatedPosts, speciesMode);
  };

  const handleSavePost = (postId: string) => {
    const updatedPosts = posts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          isSaved: !p.isSaved,
        };
      }
      return p;
    });

    setPosts(updatedPosts);
    savePosts(ownerId, updatedPosts, speciesMode);
  };

  const handleAddComment = (postId: string, text: string) => {
    const newComment = {
      id: `c_${Date.now()}`,
      postId,
      authorHandle: activeProfile.handle,
      authorName: activeProfile.name,
      authorAvatar: activeProfile.avatar,
      text,
      timestamp: 'Just now',
      treatsCount: 0,
    };

    const updatedPosts = posts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [newComment, ...p.comments],
        };
      }
      return p;
    });

    setPosts(updatedPosts);
    savePosts(ownerId, updatedPosts, speciesMode);
  };

  const handleCreatePost = (newPostData: Omit<Post, 'id' | 'timestamp' | 'treatsCount' | 'commentsCount' | 'comments'>) => {
    const newPost: Post = {
      ...newPostData,
      id: `post_${Date.now()}`,
      timestamp: 'Just now',
      treatsCount: 1,
      commentsCount: 0,
      comments: [],
    };

    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    savePosts(ownerId, updatedPosts, speciesMode);

    // Increment user treats received count
    const updatedProfiles = profiles.map((prof) => {
      if (prof.id === activeProfile.id) {
        return {
          ...prof,
          treatsReceived: prof.treatsReceived + 1,
        };
      }
      return prof;
    });
    setProfiles(updatedProfiles);
    saveProfiles(ownerId, updatedProfiles, speciesMode);
  };

  const handleTreatProfile = (profileId: string) => {
    const updatedProfiles = profiles.map((p) => {
      if (p.id === profileId) {
        return {
          ...p,
          treatsReceived: p.treatsReceived + 1,
        };
      }
      return p;
    });
    setProfiles(updatedProfiles);
    saveProfiles(ownerId, updatedProfiles, speciesMode);
  };

  const handleSelectTag = (tag: string) => {
    setSearchQuery(tag);
    handleTabChange('explore');
  };

  const handleMarkAllNotificationsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    saveNotifications(ownerId, updated, speciesMode);
  };

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;
  const savedPostsList = posts.filter((p) => p.isSaved);

  return (
    <ClerkAuthGate isDog={speciesMode === 'dog'}>
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased transition-colors">
      
      {/* Top Network Selector Header */}
      <div className="bg-zinc-900 text-white text-xs border-b border-zinc-800 py-1.5 px-4 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold uppercase tracking-wider text-[10px] bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
              Pawprint Network
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400 hidden md:inline">2 Independent Live Social Apps</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {/* The Catwalk Tab */}
            <button
              onClick={() => {
                if (speciesMode !== 'cat') handleToggleSpeciesMode();
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                speciesMode === 'cat'
                  ? 'bg-rose-500 text-white shadow-xs scale-105'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              <span>🐱 The Catwalk</span>
              <span className="text-[9px] opacity-75 font-mono">instameow.app</span>
            </button>

            {/* The Dog Park Tab */}
            <button
              onClick={() => {
                if (speciesMode !== 'dog') handleToggleSpeciesMode();
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                speciesMode === 'dog'
                  ? 'bg-amber-500 text-white shadow-xs scale-105'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              <span>🐶 The Dog Park</span>
              <span className="text-[9px] opacity-75 font-mono">instawoof.app</span>
            </button>

            {/* Deployment Roadmap Modal Button */}
            <button
              onClick={() => setIsRoadmapModalOpen(true)}
              className="ml-2 flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 rounded-full border border-amber-400/30 transition-all shrink-0"
            >
              <Rocket className="w-3 h-3 text-amber-400" />
              <span>Joint Deployment Roadmap</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Navbar */}
      <Navbar
        activeProfile={activeProfile}
        profiles={profiles}
        speciesMode={speciesMode}
        onToggleSpeciesMode={handleToggleSpeciesMode}
        onSelectProfile={handleSelectProfile}
        onOpenCreateModal={handleOpenGraphComposer}
        onOpenCreateProfileModal={() => setIsCreateProfileModalOpen(true)}
        onOpenTranslatorModal={() => setIsTranslatorModalOpen(true)}
        onOpenAnalyzerModal={() => setIsAnalyzerModalOpen(true)}
        onOpenAffiliateModal={() => setIsAffiliateModalOpen(true)}
        onOpenSocialAuthModal={() => setIsSocialAuthModalOpen(true)}
        onOpenNotifications={() => handleTabChange('notifications')}
        unreadNotificationsCount={unreadNotifsCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto flex pt-4 px-4 sm:px-6 lg:px-8">
        
        {/* Left Desktop Sidebar */}
        <Sidebar
        isDog={speciesMode === 'dog'}
                  activeTab={activeTab}
          onTabChange={handleTabChange}
          activeProfile={activeProfile}
          speciesMode={speciesMode}
          onOpenCreateModal={handleOpenGraphComposer}
          onOpenCreateProfileModal={() => setIsCreateProfileModalOpen(true)}
          onOpenTranslatorModal={() => setIsTranslatorModalOpen(true)}
          onOpenAnalyzerModal={() => setIsAnalyzerModalOpen(true)}
          onOpenAffiliateModal={() => setIsAffiliateModalOpen(true)}
          onOpenSocialAuthModal={() => setIsSocialAuthModalOpen(true)}
          onOpenSoundboard={() => setIsSoundboardOpen(true)}
          onOpenCamera={() => setIsCameraOpen(true)}
        />

        {/* Center Main Content Area */}
        <main className="flex-1 lg:ml-64 lg:mr-80 max-w-2xl mx-auto w-full">
          
          {/* Feed Tab View */}
          {activeTab === 'feed' && (
            <div className="space-y-6 pb-12">
              {/* Instagram-style Stories Header Bar */}
              <StoriesBar
isDog={speciesMode === 'dog'}
                                stories={stories}
                activeProfile={activeProfile}
                onSelectStory={(s) => setSelectedStory(s)}
                onOpenCreateStoryModal={() => setIsCreateModalOpen(true)}
              />

              <HomePage />
            </div>
          )}

          {/* Explore Tab View */}
          {activeTab === 'explore' && (
            <ExplorePage />
          )}

          {/* Saved Treats Tab View */}
          {activeTab === 'saved' && (
            <div className="space-y-6 pb-12">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>Bookmark Saved Treats</span>
                  <span className="text-sm font-normal text-zinc-400">({savedPostsList.length})</span>
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  isDog cat/dog posts you've saved to your private stash.
                </p>
              </div>

              {savedPostsList.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 space-y-2">
                  <p className="text-4xl">🔖</p>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No saved treats yet.</p>
                  <p className="text-xs text-zinc-400">Click the bookmark icon on any post to save it here.</p>
                </div>
              ) : (
                savedPostsList.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    activeHandle={activeProfile.handle}
                    onTreatPost={handleTreatPost}
                    onSavePost={handleSavePost}
                    onAddComment={handleAddComment}
                    onSelectTag={handleSelectTag}
                    isDog={speciesMode === 'dog'}
                  onOpenLightbox={(p) => setLightboxPost(p)}
                  onOpenShareModal={(p) => setSharePostTarget(p)}
                  />
                ))
              )}
            </div>
          )}

          {/* Profile Tab View */}
          {activeTab === 'profile' && (
            <ProfilePage />
          )}

          {activeTab === 'messages' && <MessagesPage />}
          {activeTab === 'notifications' && <NotificationsPage />}

        </main>

        {/* Social graph suggestions */}
        <div className="hidden xl:block fixed right-4 top-20 bottom-0 overflow-y-auto">
          <RightSidebar />
        </div>

      </div>

      {/* Mobile Sticky Bottom Navigation */}
      <BottomNav
        isDog={speciesMode === 'dog'}
                activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenCreateModal={handleOpenGraphComposer}
        onOpenTranslatorModal={() => setIsTranslatorModalOpen(true)}
      />

      {/* MODALS */}
      <CreatePostModal
        isDog={speciesMode === 'dog'}
                isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCapturedImageUrl(undefined);
        }}
        activeProfile={activeProfile}
        onCreatePost={(newPostData) => {
          handleCreatePost(newPostData);
          setCapturedImageUrl(undefined);
        }}
        initialImageUrl={capturedImageUrl}
      />

      <CreateCatProfileModal
        isOpen={isCreateProfileModalOpen}
        onClose={() => setIsCreateProfileModalOpen(false)}
        onCreateProfile={handleCreateProfile}
        speciesMode={speciesMode}
      />

      <AffiliateMarketplaceModal
        isOpen={isAffiliateModalOpen}
        onClose={() => setIsAffiliateModalOpen(false)}
        activeProfile={activeProfile}
        speciesMode={speciesMode}
      />

      <SocialAuthModal
        isOpen={isSocialAuthModalOpen}
        onClose={() => setIsSocialAuthModalOpen(false)}
        activeProfile={activeProfile}
        onUpdateSocialLinked={handleUpdateSocialLinked}
      />

      <SocialShareModal
isDog={speciesMode === 'dog'}
                        post={sharePostTarget}
        isOpen={sharePostTarget !== null}
        onClose={() => setSharePostTarget(null)}
      />

      <MeowTranslatorModal
        isOpen={isTranslatorModalOpen}
        onClose={() => setIsTranslatorModalOpen(false)}
        isDog={speciesMode === 'dog'}
      />

      <CatAnalyzerModal
        isOpen={isAnalyzerModalOpen}
        onClose={() => setIsAnalyzerModalOpen(false)}
        isDog={speciesMode === 'dog'}
      />

      <NotificationsModal
        isDog={speciesMode === 'dog'}
                isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
      />

      <StoryViewerModal
        story={selectedStory}
        onClose={() => setSelectedStory(null)}
      />

      <DeploymentRoadmapModal
        isOpen={isRoadmapModalOpen}
        onClose={() => setIsRoadmapModalOpen(false)}
      />

    </div>
      {/* Post lightbox */}
      {lightboxPost && (() => {
        const allPosts = [...catPosts, ...dogPosts];
        const idx = allPosts.findIndex(p => p.id === lightboxPost.id);
        return (
          <PostLightbox
            post={lightboxPost}
            isDog={speciesMode === 'dog'}
            onClose={() => setLightboxPost(null)}
            onTreat={() => handleTreatPost(lightboxPost.id)}
            onSave={() => handleSavePost(lightboxPost.id)}
            onShare={() => { setSharePostTarget(lightboxPost); setLightboxPost(null); }}
            hasPrev={idx > 0}
            hasNext={idx < allPosts.length - 1}
            onPrev={() => idx > 0 && setLightboxPost(allPosts[idx - 1])}
            onNext={() => idx < allPosts.length - 1 && setLightboxPost(allPosts[idx + 1])}
          />
        );
      })()}

      {/* Sound Library */}
      <SoundboardModal
        isOpen={isSoundboardOpen}
        onClose={() => setIsSoundboardOpen(false)}
        isDog={speciesMode === 'dog'}
      />

      {/* Live Filter Camera */}
      {isCameraOpen && (
        <LiveFilterCamera
          isDog={speciesMode === 'dog'}
          onCapture={(media) => {
            setCapturedImageUrl(media.url);
            setIsCameraOpen(false);
            setIsCreateModalOpen(true);
          }}
          onClose={() => setIsCameraOpen(false)}
        />
      )}
    </ClerkAuthGate>
  );
}
