// import mongoose from "mongoose";

// const MONGODB_URI = process.env.MONGODB_URI as string;

// if (!MONGODB_URI) {
//   throw new Error("please add MONGODB_URI to .env.local");
// }

// /** 
//  * Global caching is required in Next.js App Router
//  * to prevent multiple connections during hot reload.
//  */
// let cached = (global as any).mongoose;

// if (!cached) {
//   cached = (global as any).mongoose = {
//     conn: null,
//     promise: null,
//   };
// }

// export default async function connectDB() {
//   if (cached.conn) {
//     return cached.conn; // return existing connection
//   }

//   if (!cached.promise) {
//     cached.promise = mongoose
//       .connect(MONGODB_URI, {
//         bufferCommands: false,
//       })
//       .then((mongoose) => mongoose);
//   }

//   cached.conn = await cached.promise;

//   console.log("MongoDB Connected");

//   return cached.conn;
// }
import mongoose, { Mongoose } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Please provide MONGODB_URI in .env.local");
}

/**
 * Extend the global object to include a typed mongoose cache.
 */
declare global {
   
  var mongooseCache:
    | { conn: Mongoose | null; promise: Promise<Mongoose> | null }
    | undefined;
}

/**
 * Ensure the global cache always exists.
 */
if (!global.mongooseCache) {
  global.mongooseCache = {
    conn: null,
    promise: null,
  };
}

export default async function connectDB(): Promise<Mongoose> {
  // Now TypeScript knows cache ALWAYS exists
  const cache = global.mongooseCache!;

  // If already connected, reuse it
  if (cache.conn) {
    return cache.conn;
  }

  // If no connection Promise exists, create one
  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  // Wait for connection
  cache.conn = await cache.promise;

  console.log("MongoDB Connected");

  return cache.conn;
}
