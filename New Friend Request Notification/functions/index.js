 'use strict'

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.sendNotification = functions.database.ref('/Notifications/{receiveUserId}/{notification_id}')
.onWrite((data, context) =>
{
    const receiveUserId = context.params.receiveUserId;
    const notification_id = context.params.notification_id;

    console.log('We have a notification to send to : ',receiveUserId);

    if(!data.after.val())
    {
        console.log('A notification has been deleted :',notification_id);
        return null;
    }
    
    const sender_id = admin.database().ref(`/Notifications/${receiveUserId}/${notification_id}`).once('value');

    return sender_id.then(fromUserResult =>
    {
        const from_sender_id = fromUserResult.val().from;
        console.log('You have a new notification from : ',from_sender_id);
        const senderUserQuery = admin.database().ref(`/Users/${from_sender_id}/username`).once('value');

        return senderUserQuery.then(senderUserNameResult =>
        {
            const senderUserName = senderUserNameResult.val();
            const DeviceToken = admin.database().ref(`/Users/${receiveUserId}/device_token`).once('value');
                
            return DeviceToken.then(result =>
            {
                const token_id = result.val();
                const payload =
                {
                    notification:
                    {
                        title:"New Friend Request",
                        body:`${senderUserName} has sent you a request`,
                        icon:"default",
                        click_action:"com.pium.sprint.TARGET_NOTIFICATION"
                    },
                    data:
                    {
                        from_sender_id : from_sender_id
                    }
                };

                return admin.messaging().sendToDevice(token_id, payload)
                .then(response =>
                {
                    console.log('This was a notification feature.');
                });
            });
        });
    });
});

