'use strict'

// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');

admin.initializeApp();

const cors = require('cors')({
    origin: true,
});

exports.jobs = functions.https.onRequest((req, res) => {
    
    if (!(req.method === 'GET' || 'POST')) {
        return res.status(403).send('Forbidden!')
    }

    return cors(req, res, () => {
        var b = req.body;

        var data;

        if(!b.id) {
            data = {
                title: b.title, 
                description: b.description, 
                status: b.status,
                timestamp: admin.firestore.Timestamp.now()
            };
            admin.firestore().collection('jobs').add(data)
            .then(result => {
                res.status(200).json({
                    "id": result.id
                });
                return result;
            }, err => {
                res.status(400).json({
                    "message": err
                })
                console.log(err);
            }).catch(error => {
                console.log(error)
            });
        } else {
            data = {
                title: b.title, 
                description: b.description, 
                status: b.status,
                result: b.result,
                timestamp: admin.firestore.Timestamp.now()
            };
            admin.firestore().collection('jobs').doc(b.id).set(data)
            .then(result => {
                res.status(200).json({
                    "id": b.id
                });
                return result;
            }, err => {
                res.status(400).json({
                    "message": "Deu ruim" + err
                })
                console.log(err);
            }).catch(error => {
                console.log(error)
            });
        } 
    });
});

exports.changeJobs = functions.firestore.document('jobs/{jobId}').onWrite((change, context) => {
    
    let status;

    if(change.after.data().status === 0) {
        status = 'Começou'
    } else {
        status = 'Finalizou'
    }

    const payload = {
        notification: {
            title: 'Um job foi alterado',
            body: `Job ${status}.`,
            //   icon: follower.photoURL
        }
    };

    loadUsers().then(result => {
        let tokens = []

        result.forEach(r => {
            tokens.push(r.id)
        });

        push(tokens, payload);

        return result;
    }, err => {
        console.log("Deu Ruim", err);
    }).catch(error => {
        console.log("Deu Ruim Total", error);
    });
});

function loadUsers() {
    let dbRef = admin.firestore().collection('users');
    return dbRef.get();
}

function push(tokens, payload) {
    admin.messaging().sendToDevice(tokens, payload).then(
        result => {
            return result;
        }, err => {
            console.log('Notification sent failed:', err);
        }).catch(error => {
            console.log('Deu ruim total', error);
        });
}
