/**
 * Forum Presentation Hooks Index
 */

// Forum Hooks
export {
  useForumPosts,
  useForumComments,
  useForumActivity,
  type ForumPost,
  type ForumComment,
  type ForumActivity,
  type ForumActivitySummary,
} from "./use-forum";

// Demographic Prediction Hooks
export {
  useDemographicPredictions,
  useDemographicPrediction,
  useCreateDemographicPrediction,
  useMyPredictions,
  useDemographicData,
  type DemographicPrediction,
  type UserPrediction,
} from "./use-demographic-prediction";
