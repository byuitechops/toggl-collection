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
            // if they do have access, check if we need their toggle token or workspace
            if (users[user.uid].toggltoken === undefined || users[user.uid].workspace === undefined) {
                // don't have toggle api token
                // TODO: prompt for token and check if it works
                console.log('need toggltoken');
                window.location = './settings.html';
            } else {
                GLOBALS.users = users;
                GLOBALS.user = user;
                GLOBALS.toggltoken = users[user.uid].toggltoken;
                GLOBALS.workspace = users[user.uid].workspace;
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
    usersdb.on('value', snapshot => {
        var users = snapshot.val();
        if (typeof users[user.uid] != 'object') {
            usersdb.child(user.uid).set(user);
            users[user.uid] = user;
        }
        cb(null, users);
    }, err => cb(err));
}


function get(token,uri) {
    return fetch('https://toggl.com'+uri,{
        headers:{
            Authorization:'Basic '+btoa(`${token}:api_token`)
        }
    }).then(r => r.json());
}
