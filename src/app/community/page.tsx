import { getCommunityPosts, getFeaturedPosts, getUserLikedPosts, getUserRecipes, getMyPosts } from '@/actions/community';
import CommunityClient from './CommunityClient';
import { getUserProfile } from '@/actions/auth';

export default async function CommunityPage() {
  const [posts, featured, likedPostIds, userRecipes, myPosts, profile] = await Promise.all([
    getCommunityPosts(),
    getFeaturedPosts(),
    getUserLikedPosts(),
    getUserRecipes(),
    getMyPosts(),
    getUserProfile(),
  ]);

  return (
    <CommunityClient
      initialPosts={JSON.parse(JSON.stringify(posts))}
      initialFeatured={JSON.parse(JSON.stringify(featured))}
      initialLikedIds={likedPostIds}
      userRecipes={userRecipes}
      myPosts={JSON.parse(JSON.stringify(myPosts))}
      currentUserId={profile?.id ?? null}
    />
  );
}
