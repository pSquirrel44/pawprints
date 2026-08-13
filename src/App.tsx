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

export default function App() {
  const { user } = useUser();
  const [speciesMode, setSpeciesMode] = useState<'cat' | 'dog'>('cat');

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
  const [isAnalyzerModalOpen, setIsAnalyzerModalOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isAffiliateModalOpen, setIsAffiliateModalOpen] = useState<boolean>(false);
  const [isSocialAuthModalOpen, setIsSocialAuthModalOpen] = useState<boolean>(false);
  const [isRoadmapModalOpen, setIsRoadmapModalOpen] = useState<boolean>(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [sharePostTarget, setSharePostTarget] = useState<Post | null>(null);

  // Initialize data on mount
  useEffect(() => {
    const loadedCatProfiles = getStoredProfiles('cat');
    const loadedCatPosts = getStoredPosts('cat');
    const loadedCatStories = getStoredStories('cat');
    const loadedCatNotifs = getStoredNotifications('cat');
    const loadedCatActiveId = getActiveProfileId('cat');

    const loadedDogProfiles = getStoredProfiles('dog');
    const loadedDogPosts = getStoredPosts('dog');
    const loadedDogStories = getStoredStories('dog');
    const loadedDogNotifs = getStoredNotifications('dog');

    setCatProfiles(loadedCatProfiles);
    setCatPosts(loadedCatPosts);
    setCatStories(loadedCatStories);
    setCatNotifs(loadedCatNotifs);

    setDogProfiles(loadedDogProfiles);
    setDogPosts(loadedDogPosts);
    setDogStories(loadedDogStories);
    setDogNotifs(loadedDogNotifs);

    setProfiles(loadedCatProfiles);
    setPosts(loadedCatPosts);
    setStories(loadedCatStories);
    setNotifications(loadedCatNotifs);
    setActiveProfileIdState(loadedCatActiveId);
  }, []);

  const handleToggleSpeciesMode = () => {
    if (speciesMode === 'cat') {
      // Save Cat state before switching
      saveProfiles(profiles, 'cat');
      savePosts(posts, 'cat');
      saveStories(stories, 'cat');
      saveNotifications(notifications, 'cat');
      setActiveProfileId(activeProfileId, 'cat');

      setCatProfiles(profiles);
      setCatPosts(posts);
      setCatStories(stories);
      setCatNotifs(notifications);

      setSpeciesMode('dog');
      setProfiles(dogProfiles.length ? dogProfiles : INITIAL_DOG_PROFILES);
      setPosts(dogPosts.length ? dogPosts : INITIAL_DOG_POSTS);
      setStories(dogStories.length ? dogStories : INITIAL_DOG_STORIES);
      setNotifications(dogNotifs.length ? dogNotifs : INITIAL_DOG_NOTIFICATIONS);
      const activeDogId = getActiveProfileId('dog');
      setActiveProfileIdState(activeDogId || 'dog_1');
    } else {
      // Save Dog state before switching
      saveProfiles(profiles, 'dog');
      savePosts(posts, 'dog');
      saveStories(stories, 'dog');
      saveNotifications(notifications, 'dog');
      setActiveProfileId(activeProfileId, 'dog');

      setDogProfiles(profiles);
      setDogPosts(posts);
      setDogStories(stories);
      setDogNotifs(notifications);

      setSpeciesMode('cat');
      setProfiles(catProfiles);
      setPosts(catPosts);
      setStories(catStories);
      setNotifications(catNotifs);
      const activeCatId = getActiveProfileId('cat');
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
    setActiveProfileId(profile.id);
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
          title: 'The Catwalk Debut',
          description: 'Official cat profile submitted to the The Catwalk by Pawprint Network!',
          icon: '👑',
          unlockedAt: 'Just now',
        },
      ],
    };

    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    saveProfiles(updatedProfiles);

    // Auto-switch to newly created profile
    setActiveProfileIdState(newProfile.id);
    setActiveProfileId(newProfile.id);

    // Add notification
    const newNotif: NotificationItem = {
      id: `n_${Date.now()}`,
      actorHandle: newProfile.handle,
      actorName: newProfile.name,
      actorAvatar: newProfile.avatar,
      type: 'follow',
      text: `Welcome @${newProfile.handle} to The Catwalk! Your profile is live.`,
      timestamp: 'Just now',
      isRead: false,
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);
    saveNotifications(updatedNotifs);
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
    saveProfiles(updatedProfiles);
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
    savePosts(updatedPosts);
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
    savePosts(updatedPosts);
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
    savePosts(updatedPosts);
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
    savePosts(updatedPosts);

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
    saveProfiles(updatedProfiles);
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
    saveProfiles(updatedProfiles);
  };

  const handleSelectTag = (tag: string) => {
    setSearchQuery(tag);
    setActiveTab('explore');
  };

  const handleMarkAllNotificationsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    saveNotifications(updated);
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
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenCreateProfileModal={() => setIsCreateProfileModalOpen(true)}
        onOpenTranslatorModal={() => setIsTranslatorModalOpen(true)}
        onOpenAnalyzerModal={() => setIsAnalyzerModalOpen(true)}
        onOpenAffiliateModal={() => setIsAffiliateModalOpen(true)}
        onOpenSocialAuthModal={() => setIsSocialAuthModalOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadNotificationsCount={unreadNotifsCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto flex pt-4 px-4 sm:px-6 lg:px-8">
        
        {/* Left Desktop Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeProfile={activeProfile}
          speciesMode={speciesMode}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onOpenCreateProfileModal={() => setIsCreateProfileModalOpen(true)}
          onOpenTranslatorModal={() => setIsTranslatorModalOpen(true)}
          onOpenAnalyzerModal={() => setIsAnalyzerModalOpen(true)}
          onOpenAffiliateModal={() => setIsAffiliateModalOpen(true)}
          onOpenSocialAuthModal={() => setIsSocialAuthModalOpen(true)}
        />

        {/* Center Main Content Area */}
        <main className="flex-1 lg:ml-64 lg:mr-80 max-w-2xl mx-auto w-full">
          
          {/* Feed Tab View */}
          {activeTab === 'feed' && (
            <div className="space-y-6 pb-12">
              {/* Instagram-style Stories Header Bar */}
              <StoriesBar
                stories={stories}
                activeProfile={activeProfile}
                onSelectStory={(s) => setSelectedStory(s)}
                onOpenCreateStoryModal={() => setIsCreateModalOpen(true)}
              />

              {/* Feed Post List */}
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  activeHandle={activeProfile.handle}
                  onTreatPost={handleTreatPost}
                  onSavePost={handleSavePost}
                  onAddComment={handleAddComment}
                  onSelectTag={handleSelectTag}
                  isDog={speciesMode === 'dog'}
                  onOpenShareModal={(p) => setSharePostTarget(p)}
                />
              ))}
            </div>
          )}

          {/* Explore Tab View */}
          {activeTab === 'explore' && (
            <ExploreView
              posts={posts}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onTreatPost={handleTreatPost}
              onSelectTag={handleSelectTag}
            />
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
                  onOpenShareModal={(p) => setSharePostTarget(p)}
                  />
                ))
              )}
            </div>
          )}

          {/* Profile Tab View */}
          {activeTab === 'profile' && (
            <ProfileView
              profile={activeProfile}
              posts={posts}
              savedPosts={savedPostsList}
              isCurrentActiveProfile={true}
              onTreatProfile={handleTreatProfile}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
              onOpenCreateProfileModal={() => setIsCreateProfileModalOpen(true)}
              onOpenAffiliateModal={() => setIsAffiliateModalOpen(true)}
              onOpenSocialAuthModal={() => setIsSocialAuthModalOpen(true)}
            />
          )}

        </main>

        {/* Right Desktop Suggestions Widget Sidebar */}
        <aside className="hidden xl:block w-72 fixed right-4 top-20 bottom-0 overflow-y-auto space-y-6 p-2">
          
          {/* Active Cat Account Switcher Card */}
          <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs">
            <div className="flex items-center gap-3">
              <img
                src={activeProfile.avatar}
                alt={activeProfile.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full object-cover ring-2 ring-rose-500/30"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {activeProfile.name}
                </p>
                <p className="text-[11px] text-zinc-400 truncate">@{activeProfile.handle}</p>
                <p className="text-[10px] text-rose-500 font-semibold mt-0.5 truncate">
                  📍 {activeProfile.location}
                </p>
              </div>
            </div>
          </div>

          {/* Popular Cat Profiles to Follow */}
          <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Suggested Cats
              </span>
              <button
                onClick={() => setActiveTab('explore')}
                className="text-[11px] font-bold text-rose-500 hover:underline"
              >
                See All
              </button>
            </div>

            <div className="space-y-3">
              {profiles
                .filter((p) => p.id !== activeProfile.id)
                .slice(0, 3)
                .map((prof) => (
                  <div key={prof.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={prof.avatar}
                        alt={prof.name}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {prof.name}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate">@{prof.handle}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTreatProfile(prof.id)}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded-xl shrink-0 transition-colors"
                      title={speciesMode === 'dog' ? 'Give Bone' : 'Give Fish Treat'}
                    >
                      🐟 Treat
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Footer Info */}
          <div className="px-2 text-[11px] text-zinc-400 space-y-1">
            <p>© 2026 Pawprint Network • Powered by Gemini AI</p>
            <p>Made with 🐾 for cat lovers worldwide.</p>
          </div>

        </aside>

      </div>

      {/* Mobile Sticky Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenTranslatorModal={() => setIsTranslatorModalOpen(true)}
      />

      {/* MODALS */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        activeProfile={activeProfile}
        onCreatePost={handleCreatePost}
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
        post={sharePostTarget}
        isOpen={sharePostTarget !== null}
        onClose={() => setSharePostTarget(null)}
      />

      <MeowTranslatorModal
        isOpen={isTranslatorModalOpen}
        onClose={() => setIsTranslatorModalOpen(false)}
      />

      <CatAnalyzerModal
        isOpen={isAnalyzerModalOpen}
        onClose={() => setIsAnalyzerModalOpen(false)}
      />

      <NotificationsModal
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
    </ClerkAuthGate>
  );
}
