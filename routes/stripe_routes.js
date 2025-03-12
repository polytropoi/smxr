//route for intermediate landing pages

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const express = require("express");
const stripe_router = express.Router();
const validator = require('validator');


import { RunDataQuery } from "../connect/database.js";
import { requiredAuthentication} from "../server.js";


const stripe = require("stripe")(process.env.STRIPE_KEY);

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