"use strict";
// Imports dependencies and set up http server
const express = require("express"),
  bodyParser = require("body-parser"),
  app = express().use(bodyParser.json()); // creates express http server
const axios = require("axios");
const token =
  "EAAnTKGjGS64BABtLUaODnnR0INruiliRTJn9CCIJMOE1lY0Jn0pWZAs2rnN6gMfBJKkG4HJJO1qdSLlyEWceCRtOYZBNgWZASzR02wJbWc0cf3i7MFMIPzVJZCJocYyKxRxRe1bIKqaauIrNTRU2pI8esyFBdUkjOBipQvh0dwZDZD";
// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () =>
  console.log(`webhook is listening on port ${process.env.PORT || 1337}`)
);

const handlePostback = (sender, postback) => {
  // console.log('postback2', postback);
  if (postback.payload == "yes") {
    axios.post(
      `https://graph.facebook.com/v8.0/me/messages?access_token=${token}`,
      {
        recipient: { id: sender.id },
        message: { text: "thanks! devc loves you too" },
      }
    );
  }
  if (postback.payload == "no") {
    axios.post(
      `https://graph.facebook.com/v8.0/me/messages?access_token=${token}`,
      {
        recipient: { id: sender.id },
        message: { text: "it's okay, we can still be friends" },
      }
    );
  }
};

const getEntityFromMessage = (entityName, message) => {
  let entities = message.nlp.entities;
  switch(entityName) {
    case 'location':
      return entities['wit$location:location'] && entities['wit$location:location'][0].value;
    case 'drink_type':
      return entities['drink_type:drink_type'] && entities['drink_type:drink_type'][0].value;
    case 'datetime':
      return entities['wit$datetime:datetime'] && entities['wit$datetime:datetime'][0].value;  
  }
}

const handleCoffeeOrder = (sender, message) => {
  let location = getEntityFromMessage('location', message)
  let drinkType = getEntityFromMessage('drink_type', message);
  let deliveryTime = getEntityFromMessage('datetime', message);

  console.log('location', location);
  console.log('drinkType', drinkType);
  console.log('deliveryTime', deliveryTime);
  
  sendMsg(sender, {text: `Yes my human master. Your loyal slave will send a ${drinkType} to ${location} at ${deliveryTime}`});
}
const sendMsg = (sender, message) => {
  axios.post(
    `https://graph.facebook.com/v8.0/me/messages?access_token=${token}`,
    {
      recipient: { id: sender.id },
      message: {
        text: `${message.text}`,
      },
      // message: response
    }
  );
}
const handleMessage = (recipient, message) => {
  console.log("recipientxxxx", recipient);
  console.log("messagexxxxx", message);

  if(message.nlp) {
    if(message.nlp.intents) {
      let intent = message.nlp.intents[0];
      if(intent && intent.name === 'Coffee_Ordering' && intent.confidence > 0.6) {
        return handleCoffeeOrder(recipient, message);
      }
    }
    return;
  }

  
};
const response = {
  attachment: {
    type: "template",
    payload: {
      template_type: "generic",
      elements: [
        {
          title: "Do you love DevC?",
          subtitle: "Tap a button to answer.",
          image_url:
            "https://www.techsignin.com/wp-content/uploads/2019/05/facebook-developer-circles-vietnam-innovation-challenge-22.jpg",
          buttons: [
            {
              type: "postback",
              title: "Yes!",
              payload: "yes",
            },
            {
              type: "postback",
              title: "No!",
              payload: "no",
            },
          ],
        },
      ],
    },
  },
};

// Creates the endpoint for our webhook
app.post("/webhook", (req, res) => {
  let body = req.body;
  // console.log('body', body);
  console.log(JSON.stringify(body, null, 4));

  // Checks this is an event from a page subscription
  if (body.object === "page") {
    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function (entry) {
      const { sender, message, postback } = entry.messaging[0];
      console.log("message", message);
      if (postback) {
        return handlePostback(sender, postback);
      } else {
        return handleMessage(sender, message);
      }

      // let webhook_event = entry.messaging[0]

      // axios.post(
      //   `https://graph.facebook.com/v8.0/me/messages?access_token=${token}`,
      //   {
      //     recipient: { id: webhook_event.sender.id },
      //     message: {
      //       text: `Hi! I've received your message ${webhook_event.message.text}`
      //     }
      //     // message: response
      //   }
      // )
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send("EVENT_RECEIVED");
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});
// Creates the endpoint for our webhook
// Adds support for GET requests to our webhook
app.get("/webhook", (req, res) => {
  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = "ToiYeuDevC";

  // Parse the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];
  console.log("body", req.query);
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});
