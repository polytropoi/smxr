//hoisted mongo io
import { createRequire } from "module";
const require = createRequire(import.meta.url);
require('dotenv').config();

import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
// import { db } from "../server.js";
/////////// official mongo driver, going here...
const uri = process.env.MONGO_URL || "";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const db = client.db(); 

export async function RunDataQuery(coll,type,query,update) {  //TODO Sqlite!
    // if (!db) {
    //     console.log("wheres the db?");
    //     db = client.db();
    // }
    console.log("tryna RunDataQuery " + coll + " " + type  + " " + JSON.stringify(query) + " " + JSON.stringify(update));
    switch  (type) {

        case "find": //i.e. more than one
            try {
                return await db.collection(coll).find(query).toArray();
            } catch (e) {
                console.log("db find error " + e);
                return ([]); //? or empty string or array? 
            }
        ////////////////////////////////           
        case "findOne": //return only one
            try {
                return await db.collection(coll).findOne(query);
            } catch (e) {
                console.log("db findOne error " + e);
                return (null); 
            }
        ////////////////////////////////
        case "update": //return only one
            try {
                return await db.collection(coll).update(query);
            } catch (e) {
                console.log("db update error " + e);
                return (null); 
            }
        ////////////////////////////////
        case "save": //deprecated, uses insertOne
            try {
                return await db.collection(coll).insertOne(query);
            } catch (e) {
                console.log("db save error " + e);
                return (null); 
            }
        ////////////////////////////////
        case "insertOne": //return only one
            try {
                return await db.collection(coll).insertOne(query);
            } catch (e) {
                console.log("db insertOne error " + e);
                return (null); 
            }
        ////////////////////////////////    
        case "remove": //deprecated, use deleteOne
            try {
                return await db.collection(coll).deleteOne(query);
            } catch (e) {
                console.log("db remove error " + e);
                return (null); 
            }
        ////////////////////////////////    
        case "deleteOne": 
        try {
            return await db.collection(coll).deleteOne(query);
        } catch (e) {
            console.log("db deleteOne error " + e);
            return (null); 
        }
        ////////////////////////////////    
        case "deleteMany": 
        try {
            return await db.collection(coll).deleteMany(query);
        } catch (e) {
            console.log("db deleteMany error " + e);
            return (null); 
        }
        case "updateOne": 
        try {
            const options = { upsert: true };
            return await db.collection(coll).updateOne(query, update, options);
        } catch (e) {
            console.log("db updateOne error " + e);
            return (null); 
        }
    }
    
}