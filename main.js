/* eslint no-console:0 */
/* global displayGraph, firebase */

const GLOBALS = {
    users:null,
    user:null,
    workspace:null,
    toggltoken:null,
}; 
    

firebase.auth().onAuthStateChanged(user => {
    if (user) {
    // User is logged in, 
    // Simplify user object
        user = {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            uid: user.uid,
            admin: false
        };
        console.log('logged in', user);
        // check to see if they have access to the database
        openDatabase(user, (err, users) => {
            if (err) {
                // they don't have access to the database
                console.error('no access');
                document.querySelector('#msg').innerHTML = '<p>No Access. Please have Ben (or Josh) add you to Firebase</p>';
                document.querySelector('#msg').classList.remove('hide');
                return;
            }
            console.log('database:', users);
            // if they do have access, check if we need their toggle token or workspace
            if (users[user.uid].toggltoken === undefined || users[user.uid].workspace === undefined) {
                // don't have toggle api token
                // TODO: prompt for token and check if it works
                console.log('need toggltoken');
                window.location = './settings.html';
            } else {
                GLOBALS.users = users;
                GLOBALS.user = users[user.uid]
                // we are good to go
                // displayGraph(weekNum, userId)
                displayGraph(0);
            }
        });
    } else {
    // User not logged in, redirect to login page
        window.location.href = '/login.html';
    }
}, console.error);


function openDatabase(user, cb) {
    var usersdb = firebase.database().ref('users');
    usersdb.child(user.uid).on('value',snapshot => {
        var snap = snapshot.val()
        if(typeof snap != 'object'){
            usersdb.child(user.uid).set(user)
            return
        }
        if(snap.admin == true){
            usersdb.on('value', snapshot => {
                var users = snapshot.val();
                cb(null, users);
            },cb)
        } else {
            cb(null, {[user.uid]:snap})
        }
    },cb)
}

function get(token,uri) {
    return fetch('https://toggl.com'+uri,{
        headers:{
            Authorization:'Basic '+btoa(`${token}:api_token`)
        }
    }).then(r => r.json());
}
