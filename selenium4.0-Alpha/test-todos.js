const {Builder, By, Key, until} = require('selenium-webdriver');
const rp = require('request-promise-native');

// Credentials for CBT
let username = 'chase@crossbrowsertesting.com';
let authkey = 'NOTMYAUTHKEY';
let auth = {
    username: username,
    password: authkey
}

// used to create the RemoteWebDriver 
let hubUrl = 'https://' + username + ':' + authkey + '@hub.crossbrowsertesting.com:443/wd/hub';
let apiUrl = 'https://crossbrowsertesting.com/api/v3/selenium/';
let caps = {
    'name': 'NodeJS Test',
    'browserName': 'Chrome',
    'platform': 'Windows 10',
    'recordVideo': true
};

(async function example() {
    // create a WebDriver instance pointed at CBT
    let driver = await new Builder()
                    .usingServer(hubUrl)
                    .withCapabilities(caps)
                    .build();
    var sessionId = null;
    var score = 'fail';
    try {
        // navigate to our URL
        await driver.get('http://crossbrowsertesting.github.io/todo-app.html');

        // we'll use this for API calls later. 
        var session = await driver.getSession();
        sessionId = session.id_;

        var results = await getTestInfo(sessionId);
        console.log('See your test run on ' + results.show_result_public_url);

        // interact with elements on the page. 
        await driver.findElement(By.name("todo-4")).click();
        await driver.findElement(By.name("todo-5")).click();

        // take a snapshot using CBT's API.
        await takeSnapshot(sessionId);
        await driver.findElement(By.id("todotext")).sendKeys("Run your first Selenium Test");
        await driver.findElement(By.linkText("archive")).click();
        await takeSnapshot(sessionId);
        var elems = await driver.findElements(By.className('ng-pristine'));

        // set the score based on the outcome of the test.
        if (elems.length === 3) {
            score = 'pass';
        }
    } catch (e) {
        console.log('Test Error: ', e);
    } finally {
        await setScore(sessionId, score);
        await driver.quit();
    }
})();

async function getTestInfo(sessionId) {
    var options = {
        method: 'GET',
        uri: apiUrl + sessionId,
        json: true,
        auth: auth
    }
    return await rp(options);
}

async function setScore(sessionId, score) {
    var options = {
        method: 'PUT',
        uri: apiUrl + sessionId,
        json: true,
        body: {
            action: 'set_score',
            score: score
        },
        auth: auth
    }
    return await rp(options);
}

async function takeSnapshot(sessionId) {
    var options = {
        method: 'POST',
        uri: apiUrl + sessionId + '/snapshots',
        json: true,
        auth: auth
    }
    return await rp(options);
}
