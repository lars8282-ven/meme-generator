// instant.perms.js

/**
 * @type {import('@instantdb/react').InstantRules}
 */
const rules = {
  "memes": {
    "allow": {
      "view": "true", // Allow anyone (including anonymous) to view memes
      "create": "auth.id != null", // Only authenticated users can create
      "update": "isOwner", // Only the owner can update
      "delete": "isOwner", // Only the owner can delete
    },
    "bind": [
      "isOwner", "auth.id != null && auth.id == data.userId",
      "isStillOwner", "auth.id != null && auth.id == newData.userId"
    ]
  },
  "upvotes": {
    "allow": {
      "view": "true", // Allow anyone (including anonymous) to view upvotes
      "create": "auth.id != null", // Only authenticated users can create upvotes
      "update": "isOwner", // Only the owner can update
      "delete": "isOwner", // Only the owner can delete
    },
    "bind": [
      "isOwner", "auth.id != null && auth.id == data.userId",
      "isStillOwner", "auth.id != null && auth.id == newData.userId"
    ]
  }
};

export default rules;

