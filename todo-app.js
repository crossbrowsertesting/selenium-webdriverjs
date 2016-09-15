// Todo App - Selenium Example Script
// see https://github.com/SeleniumHQ/selenium/wiki/WebDriverJs for details
// runs test against http://crossbrowsertesting.github.io/todo-app.html

var webdriver = require('selenium-webdriver');
var SeleniumServer = require('selenium-webdriver/remote').SeleniumServer;
var request = require('request');
var remoteHub = 'http://hub.crossbrowsertesting.com:80/wd/hub';

var username = 'user@email.com'; //replace with your email address 
var authkey = '12345'; //replace with your authkey 

var caps = {
    name : 'Todo App Example',
    build :  '1.0',
    browser_api_name : 'IE10', 
    os_api_name : 'Win7x64-C2', 
    screen_resolution : '1024x768',
    record_video : 'true',
    record_network : 'true',
    browserName : 'internet explorer', // <---- this needs to be the browser type in lower case: firefox, internet explorer, chrome, opera, or safari
    username : username,
    password : authkey
};

var sessionId = null;

//register general error handler
webdriver.promise.controlFlow().on('uncaughtException', webdriverErrorHandler);

console.log('Connection to the CrossBrowserTesting remote server');

var driver = new webdriver.Builder()
            .usingServer(remoteHub)
            .withCapabilities(capabilities)
            .build();

//console.log('driver is ', driver)



// All driver calls are automatically queued by flow control.
// Async functions outside of driver can use call() function.
// To get a feel for the order of execution the console.logs happen after each command is actually run
console.log('Waiting on the browser to be launched and the session to start');

driver.getSession().then(function(session){
    sessionId = session.id_; //need for API calls
    console.log('Session ID: ', sessionId); 
    console.log('See your test run at: https://app.crossbrowsertesting.com/selenium/' + sessionId)
});

//load your URL
driver.get('http://crossbrowsertesting.github.io/todo-app.html').then(function(){
    console.log('loaded URL')
});

//take snapshot via cbt api
driver.call(takeSnapshot).then(function(result){
    console.log('takeSnapshot 1: ', result.error ? 'failed' : 'success')
});

//find checkout and click it 
driver.findElement(webdriver.By.name("todo-4")).click().then(function(){
    console.log('clicked todo-4')
});

//take snapshot via cbt api
driver.call(takeSnapshot).then(function(result){
    console.log('takeSnapshot 2: ', result.error ? 'failed' : 'success')
});

 //find checkout and click it 
driver.findElement(webdriver.By.name("todo-5")).click().then(function(){
    console.log('clicked todo-5')
});

//take snapshot via cbt api
driver.call(takeSnapshot).then(function(result){
    console.log('takeSnapshot 3: ', result.error ? 'failed' : 'success')
});

//send keys to element to enter text
driver.findElement(webdriver.By.id("todotext")).sendKeys("Run your first Selenium Test").then(function(){
    console.log('entered text')
});

//click add button
driver.findElement(webdriver.By.id("addbutton")).click().then(function(){
    console.log('clicked add button')
});

//take snapshot via cbt api
driver.call(takeSnapshot).then(function(result){
    console.log('takeSnapshot 4: ', result.error ? 'failed' : 'success')
});

//click the archive button
driver.findElement(webdriver.By.linkText("archive")).click().then(function(){
    console.log('clicked archive button')
});

//take snapshot via cbt api
driver.call(takeSnapshot).then(function(result){
    console.log('takeSnapshot 5: ', result.error ? 'failed' : 'success')
});

//get the page title
driver.getTitle().then(function(title){
    console.log('page title is ', title)
});

//quit the driver
driver.quit().then(function(){
    console.log('quit the driver')
});

//set the score as passing
driver.call(setScore, null, 'pass').then(function(result){
    console.log('set score to pass')
});


//Call API to set the score
function setScore(score) {

    //webdriver has built-in promise to use
    var deferred = webdriver.promise.defer();
    var result = { error: false, message: null }

    if (sessionId){
        
        request({
            method: 'PUT',
            uri: 'https://crossbrowsertesting.com/api/v3/selenium/' + sessionId,
            body: {'action': 'set_score', 'score': score },
            json: true
        },
        function(error, response, body) {
            if (error) {
                result.error = true;
                result.message = error;
            }
            else if (response.statusCode !== 200){
                result.error = true;
                result.message = body;
            }
            else{
                result.error = false;
                result.message = 'success';
            }

            deferred.fulfill(result);
        })
        .auth(username, authkey);
    }
    else{
        result.error = true;
        result.message = 'Session Id was not defined';
        deferred.fulfill(result);
    }

    return deferred.promise;
}

//Call API to get a snapshot 
function takeSnapshot() {

    //webdriver has built-in promise to use
    var deferred = webdriver.promise.defer();
    var result = { error: false, message: null }
    
    if (sessionId){

       
        request.post(
            'https://crossbrowsertesting.com/api/v3/selenium/' + sessionId + '/snapshots', 
            function(error, response, body) {
                if (error) {
                    result.error = true;
                    result.message = error;
                }
                else if (response.statusCode !== 200){
                    result.error = true;
                    result.message = body;
                }
                else{
                    result.error = false;
                    result.message = 'success';
                }
                //console.log('fulfilling promise in takeSnapshot')
                deferred.fulfill(result);
            }
        )
        .auth(username,authkey);
        
    }
    else{
        result.error = true;
        result.message = 'Session Id was not defined';
        deferred.fulfill(result); //never call reject as we don't need this to actually stop the test
    }

    return deferred.promise;
}

//general error catching function
function webdriverErrorHandler(err){

    console.error('There was an unhandled exception! ' + err);

    //if we had a session, end it and mark failed
    if (driver && sessionId){
        driver.quit();
        setScore('fail').then(function(result){
            console.log('set score to fail')
        })
    }
}
