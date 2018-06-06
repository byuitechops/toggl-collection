/* eslint no-console:0 */

import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';
import * as qwest from 'qwest';

const app = firebase.initializeApp({
    apiKey: 'AIzaSyDivGb3qYsVppVyWu0kQP9TsMxJKVI_2EE',
    authDomain: 'toggl-collection.firebaseapp.com',
    databaseURL: 'https://toggl-collection.firebaseio.com',
    projectId: 'toggl-collection',
    storageBucket: '',
    messagingSenderId: '321698368957'
});

firebase.auth().onAuthStateChanged(user => {
    if (user) {
    // User is logged in, 
    // Simplify user object
        user = {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            uid: user.uid,
        };
        console.log('logged in', user);
        // check to see if they have access to the database
        openDatabase(user, (err, users) => {
            if (err) {
                // they don't have access to the database
                // TODO: display error
                console.error('no access');
                document.querySelector('#msg').innerHTML = '<p>No Access. Please have Ben (or Josh) add you to Firebase</p>';
                document.querySelector('#msg').classList.remove('hide');
                return;
            }
            console.log('database:', users);
            // if they do have access, check if we need their toggle token
            if (users[user.uid].toggltoken === undefined) {
                // don't have toggle api token
                // TODO: prompt for token and check if it works
                console.log('need toggltoken');
                window.location = './togglToken.html';
            } else {
                // we are good to go
            }
        });
    } else {
    // User not logged in, redirect to login page
        window.location.href = '/login.html';
    }
}, console.error);


function openDatabase(user, cb) {
    var usersdb = firebase.database().ref('users');
    usersdb.on('value', snapshot => {
        var users = snapshot.val();
        if (typeof users[user.uid] != 'object') {
            usersdb.child(user.uid).set(user);
            users[user.uid] = user;
        }
        cb(null, users);
    }, err => cb(err));
}