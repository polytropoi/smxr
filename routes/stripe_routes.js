//route for intermediate landing pages

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const express = require("express");
const stripe_router = express.Router();
const validator = require('validator');


import { RunDataQuery } from "../connect/database.js";
import { requiredAuthentication, checkAppID } from "../server.js";


const stripe = require("stripe")(process.env.STRIPE_KEY);

// stripe_router.post('/stripe_testpurchase', checkAppID, requiredAuthentication, function (req, res) {
//     console.log("tryna post test purchase: " + JSON.stringify(req.body));
//     let _id = ObjectId.createFromHexString(req.body.userID);
//     let storeitemID = ObjectId.createFromHexString(req.body.storeitemID);
//     let obody = req.body;
    
//     db_old.users.findOne({"_id" : _id}, function (err, user) {// check user
//         if (err || !user) {
//             console.log("error getting user: " + err);
//             res.send("error " + err);
//         } else {
//             db_old.storeitems.findOne({"_id" : storeitemID}, function (err, storeitem){ //check store item
//                 if (err || !storeitem) {
//                     console.log("no store item error " + err);
//                     res.send("error " + err);
//                 } else {
//                     let usertotal = 0;
//                     db_old.purchases.find({userID: req.body.userID, storeitemID: req.body.storeitemID}, function (err, purchases) { //check user's previous purchases of this item doesn't exceed maxPerUser
//                         if (err) {
//                             console.log("error! " + err);
//                         } else {

//                             for (let i = 0; i < purchases.length; i++) {
//                                 let quantity = (purchases[i].quantity != null) ? purchases[i].quantity : 1;
//                                 usertotal += quantity;
//                             }
//                             if (usertotal >= storeitem.maxPerUser) {
//                                 console.log("maxPerUser exceeded!");
//                                 res.send("this user can't buy more of these!");
//                             } else {
//                                 console.log("checking inventory totalSold == " + total + " maxTotal ==  " + storeitem.maxTotal );
//                                 if (storeitem.maxTotal == 0 || total < storeitem.maxTotal) { //check maxTotal
//                                     var userEmail = user.email;
//                                     console.log("tryna charge " + userEmail);
//                                     obody.userEmail = userEmail;
//                                     obody.purchaseStatus = "Test Purchase"
//                                     if (obody.quantity == null) {
//                                         obody.quantity = 1;
//                                     }
//                                     // if (obody.quantity < storeitem.maxPerUser) {
//                                     db_old.purchases.save(obody, function (err, saved) {
//                                         if ( err || !saved ) {
//                                             console.log('purchase not saved..');
//                                             res.send("purchase failed");
//                                         } else {
//                                             var item_id = saved._id.toString();
//                                             console.log('new purchase id: ' + item_id);
//                                             db_old.storeitems.update( { "_id": storeitemID },{ $inc: { totalSold: obody.quantity }});
//                                             var htmlbody = "Thanks for your Purchase: " + JSON.stringify(saved);
//                                             (async () => {
//                                                 try {
//                                                     const status = await SendEmail(userEmail, adminEmail, htmlbody, "Your Purchase");
//                                                     const status2 = await SendEmail(userEmail, adminEmail, htmlbody, "Your Purchase ADMIN");
//                                                 } catch (e) {
//                                                      console.log("error sending! " + e);
//                                                 }

//                                             })(); 
                                           
//                                             res.send("purchase id: " + item_id + " charged " + saved.price);
//                                         }
//                                     });
//                                 } else {
//                                     console.log("Sold Out!")
//                                     res.send("that item is sold out");
//                                 }
//                             }
//                         }
//                     }); //check user's purchases for this item
//                     let total = 0;
//                     if (storeitem.totalSold != null) {
//                         total = storeitem.totalSold;
//                     }

//                 } 
//             }); 

//         }
//     });
// });

stripe_router.post('/stripe_purchase', checkAppID, requiredAuthentication, function (req, res) {
    console.log("tryna post purchase: " + JSON.stringify(req.body));

    var _id = ObjectId.createFromHexString(req.body.userID);
    var obody = req.body;
    (async () => {
        try {
            const query = {"_id" : _id};
            const user = await RunDataQuery("users", "find", query);
            var userEmail = user.email;
            console.log("tryna charge " + userEmail);
            obody.userEmail = userEmail;
            if (user.stripeCustomerID != null) {
                stripe.charges.create({
                    amount: 1500, // $15.00 this time
                    currency: "usd",
                    customer: user.stripeCustomerID,
                    receipt_email: userEmail,
                    description: req.body.purchaseDescription,

                }).then(function(charge){
                    console.log(JSON.stringify(charge));
                    obody.stripeToken = charge;
                    //TODO use async method for stripe charge 

                    // const saved = await RunDataQuery("purchases", "insertOne", obody);
                    // var item_id = saved.insertedId.toString();
                    // console.log('new purchase id: ' + item_id);
                    // res.send("purchase id: " + item_id + " charged " + JSON.stringify(charge));

                    // db_old.purchases.save(obody, function (err, saved) {
                    //     if ( err || !saved ) {
                    //         console.log('purchase not saved..');
                    //         res.send("nilch");
                    //     } else {
                    //         var item_id = saved._id.toString();
                    //         console.log('new purchase id: ' + item_id);
                    //         res.send("purchase id: " + item_id + " charged " + JSON.stringify(charge));
                    //     }
                    // });
                });
            } else {
                console.log("no customerID, so no purchase ");
                res.send("no customerID, so no purchase ");
            }
        } catch (e) {

        }
    })();
    // db_old.users.findOne({"_id" : _id}, function (err, user) {
    //     if (err || !user) {
    //         console.log("error getting user: " + err);
    //         res.send("error " + err);
    //     } else {
    //         var userEmail = user.email;
    //         console.log("tryna charge " + userEmail);
    //         obody.userEmail = userEmail;
    //         if (user.stripeCustomerID != null) {
    //             stripe.charges.create({
    //                 amount: 1500, // $15.00 this time
    //                 currency: "usd",
    //                 customer: user.stripeCustomerID,
    //                 receipt_email: userEmail,
    //                 description: req.body.purchaseDescription,

    //             }).then(function(charge){
    //                 console.log(JSON.stringify(charge));
    //                 obody.stripeToken = charge;
    //                 db_old.purchases.save(obody, function (err, saved) {
    //                     if ( err || !saved ) {
    //                         console.log('purchase not saved..');
    //                         res.send("nilch");
    //                     } else {
    //                         var item_id = saved._id.toString();
    //                         console.log('new purchase id: ' + item_id);
    //                         res.send("purchase id: " + item_id + " charged " + JSON.stringify(charge));
    //                     }
    //                 });
    //             });
    //         } else {
    //             console.log("no customer id!");
    //             res.send("no id");
    //         }
    //     }
    // });
});

stripe_router.post('/stripe_charge', requiredAuthentication, function (req,res) {

    // (LATER): When it's time to charge the customer again, retrieve the customer ID.

    (async () => {
        try {
            const query = {"userName": req.body.uname};
            const user = await RunDataQuery("users", "findOne",query);
            if (user) {
                if (user.stripeCustomerID != null) {
                    stripe.charges.create({
                        amount: 1500, // $15.00 this time
                        currency: "usd",
                        customer: user.stripeCustomerID,
                    }).then(function(charge){
                        console.log("stripeCharge : " + req.body.uname);
                        res.send(JSON.stringify(charge));
                        
                    });
                } else {
                        console.log("no stripe customer id!");
                        res.send("no stripe customer ID!");
                }
            }
        } catch (e) {
            res.send("error doing stripe charge " +e);
        }
    })();

});

stripe_router.post('/stripe_collect_data', function (req,res) { // hrm...

    var token = req.body.stripeToken;
    var purchaseTimestamp = Date.now();
    var customerID = "";
    stripe.customers.create({
        email: req.body.stripeEmail,
        source: token
    }).then(function(customer) {
        //Save the customer ID and other info in a database for later.
        customerID = customer.id;
        return stripe.charges.create({
            amount: req.body.amountInCents,
            currency: "usd",
            receipt_email: req.body.stripeEmail,
            customer: customer.id
        });
    }).then(function(charge) {
        // Use and save the charge info.
        // console.log("charged! " + token +  " body:  " + JSON.stringify(req.body) + " charge " + JSON.stringify(charge));
        req.body.purchaseTimestamp = purchaseTimestamp;
        req.body.chargeDetails = charge;

        (async () => {
            try {
                const query = {"email": req.body.stripeEmail };
                const user = await RunDataQuery("users", "findOne",query);
                if (!user) { //no user found w/ email, so new user
                    var item_id = saved._id.toString(); //purchase ID
                    console.log('new purchase id: ' + item_id);
                    var from = "admin@servicemedia.net";
                    var timestamp = Math.round(Date.now() / 1000);
                    var ip = req.headers['x-forwarded-for'] ||
                        req.connection.remoteAddress ||
                        req.socket.remoteAddress ||
                        req.connection.socket.remoteAddress;
                    var userPass = shortid.generate();
                    const cleanhash = bcrypt.genSalt(10, function(err, salt) {
                        bcrypt.hash(userPass, salt, null, function(err, hash) {
                        return validator.blacklist(hash, ['/','.','$']);                       
                        });
                    });
                    const newUser = await RunDataQuery("users", "insertOne", updoc);
                    const updoc = {
                        type : 'webuser',
                        status : 'unvalidated',
                        userName : req.body.stripeEmail,
                        email : req.body.stripeEmail,
                        createDate : timestamp,
                        validationHash : cleanhash,
                        createIP : ip,
                        paymentStatus: "ok",
                        lastPurchaseID: item_id,
                        password : hash
                    };
                    var user_id = newUser._id.toString();
                    console.log("userID: " + user_id);

                    htmlbody = "Welcome to " + topName + ", " + req.body.stripeEmail + "! <br><a href=\"" + rootHost + "/validate/" + cleanhash + "\">To get started, click here to validate account</a> <br><br>"+
                    "You may then log into the app, using your email as username, and with the password <strong>" + userPass + "</strong> which you may change at any time." +
                    " You may also change your username, but your account will remain tied to this email address.<br><br>" +
                    "Payment ID: " + item_id;

                    const mailStatus = await SendEmail(req.body.stripeEmail, process.env.ADMIN_EMAIL, htmlbody, 'New ' + topName + ' Subscription!');
                    console.log("new sub mail " + mailStatus);

                } else {
                    //existing user
                    console.log("tryna update payment for existing user " + req.body.stripeEmail);
                    const saved = await RunDataQuery("payments", "insertOne", req.body);
                    const item_id = saved._id.toString();
                    const userquery =  { "email": req.body.stripeEmail };
                    const updoc = { $set: { stripeCustomerID: customerID, paymentStatus: "ok", lastPurchaseID : item_id }}; //what else?
                    const updated = await RunDataQuery("users", "updateOne", userquery, updoc);
                    htmlbody = "Thanks for your support, your payment was received! You should be able login as usual.<br>"+
                    "If you need to reset your password, go to " + rootHost + "/#/reset/<br>" + 
                    "If you have any questions or problems, you may reply to this email, or contact polytropoi@gmail.com. <br>Best regards,<br>Jim Cherry<br><br>" +
                    "Payment ID: " + item_id;
                    const mailStatus = await SendEmail(req.body.stripeEmail, process.env.ADMIN_EMAIL, htmlbody, topName + ' Payment Received - Thanks!');
                    console.log("new sub mail " + mailStatus);
                }
                res.redirect("/#/newthanks");
            } catch (e) {
                res.send("error processing stripe charge " +e);
            }
        })();
    });
});

export default stripe_router;