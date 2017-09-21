
// change user 
var chosenUser = "ycy";


// site specific
const ff = require('./config/config.js').fitnessFirst;
const selectors = require('./config/config.js').fitnessFirst.selectors;

const mailOptions = require('./config/config.js').mailOptions;
const mailgun = require('mailgun-js')(mailOptions);

const webd = require('selenium-webdriver');
const chromeCapabilities = webd.Capabilities.chrome();
chromeCapabilities.set('chromeOptions', { args: ['--headless'] });

const d = new webd.Builder()
    .forBrowser('chrome')
    .withCapabilities(chromeCapabilities)
    .build(); 

// resize browser to prevent click errors
// FF page not properly responsive for PhantomJS
d.manage().window().setSize(1050, 900);

const sendScreenshot = (user) => {
    let emailObject = mailOptions.emailObject;
    emailObject.subject = `Screenshot for booking by ${user}`;
    d.takeScreenshot()
        .then(base64String => {
            let imageBuffer = new Buffer(base64String, 'base64');
            let date = (new Date()).toString();
            let inline = new mailgun.Attachment({
                    data: imageBuffer,
                    filename: date,
                    contentType: 'image/png'
                }
            );
            emailObject.inline = inline;
        })
        .then(res => {
            console.log('Sending email');
            mailgun.messages().send(emailObject, function (error, body) {
                console.log(body);
            });
        });
}

const clickBookButton = (chosenClass, chosenUser) => {
    let bookbutton = d.wait(webd.until.elementLocated(chosenClass), 15000);
    //scrollIntoView default param true, will push the elem to the top of the page 
    d.executeScript("arguments[0].scrollIntoView()", bookbutton);
    // check if button is less than 300px from top, scroll up 350)
    let checkHeightScript = "if(arguments[0].getBoundingClientRect().top < 300){ window.scrollBy(0, -350)}";
    d.executeScript(checkHeightScript, bookbutton);
    sendScreenshot(chosenUser);
    bookbutton.click();
    d.wait(webd.until.elementLocated(selectors.submitButton), 15000).click();
}


// you need a webd.until
d.get(ff.url);

let user = ff.users[chosenUser];
d.wait(webd.until.elementLocated(selectors.selectArrow), 20000).click();
d.wait(webd.until.elementLocated(selectors.bugisOption), 20000).click();
d.findElement(selectors.userIdField).sendKeys(user.email);
d.findElement(selectors.userPassword).sendKeys(user.password);
d.findElement(selectors.loginButton).click();
d.sleep(4000); 
// must sleep otherwise it will jump to locate the element before logging in
clickBookButton(selectors.testingClass, chosenUser);
d.findElement(selectors.logoutButton).click();

d.quit();

