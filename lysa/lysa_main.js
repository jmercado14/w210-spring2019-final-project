var assert = require('assert')

var user_id = 'anon';
var expected_hrs = 'NA';
var current_time = Date();
var q_num;
const vader = require('vader-sentiment');

function identifySentiment(user_response) {
  var intensity = vader.SentimentIntensityAnalyzer.polarity_scores(user_response);
  console.log(intensity)
  var indexOfMaxValue = [intensity.neg, intensity.neu, intensity.pos].reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
  return indexOfMaxValue
}

var MongoClient = require('mongodb').MongoClient;
let url = //hidden

function addDataInDB(convo, next) {
  MongoClient.connect(url, {useNewUrlParser: true,}, function(err, db) {
    if (err) {
      console.log(err)
      process.exit(0)
    }
    var db2 = db.db("lysten-chat1");
    let collection = db2.collection('messages')
    var record = {
      "student_id": user_id,
      "time": current_time,
      "topic": convo.vars.topic,
      "course_content": convo.vars.course,
      "prof_name": convo.vars.prof_name,
      "emoji_sentiment": convo.vars.emoji_rating,
      "response_good": convo.vars.response_working_well,
      "response_bad": convo.vars.response_needs_improvement,
      "response_add_feedback": convo.vars.response_addl_feedback,
      "response_full": convo.vars.response_working_well + " " + convo.vars.response_needs_improvement + " " + convo.vars.response_addl_feedback,
      "scale": convo.vars.scale,
      "expected_hrs": convo.vars.expected_hrs
    };
    collection.insertOne(record, function(err, doc) {
      if (err) {
        console.log(err)
        process.exit(0)
      }
      db.close();
    })
  });
  next();
}

var verifyUserExists = function(db, callback, username){
  var db1 = db.db("lysten-users");
  let collection = db1.collection('users')
  
  collection.findOne({"slack_id": username}, function(err, result) {
    assert.equal(null, err);
    callback(result);
  });
}

var addNewUser = function(db, username){
  var db1 = db.db("lysten-users");
  let collection = db1.collection('users')

  collection.updateOne(
    {"slack_id": username},
    { $setOnInsert: { "slack_id": user_id } },
    { upsert: true }
  );
}

module.exports = function(controller) {
  controller.hears(['^Hi Lysa$'], 'direct_message', function(bot, message) {
    bot.reply(message, "Hi " + '<@' + message.user + '>' + ", I'm Lysa, your friendly neighborhood feedback bot!");

    bot.api.users.info({user: message.user}, function(err, info){
      user_id = info.user.id;
    });
    MongoClient.connect(url, {useNewUrlParser: true,}, function(err, db) {
      if (!err){
        assert.equal(null, err);
        verifyUserExists(db, function(userExists) {
          if (userExists == null){
            addNewUser(db, user_id);
            bot.reply(message, "I'm an anonymous Slack bot created by MIDS students to better understand how classes are going for current students.\n I have limited capabilities, such as discussing how class is going for you or talking about any difficultues with technologies used.")
          } else {
            bot.reply(message, "I am excited to have you here today!");
          }
          console.log(userExists);
          db.close();
        }, user_id);
      } else {
        console.log(err);
      }
    });

    bot.createConversation(message, function(err, convo) {
      // Add some messages to our default thread
      convo.ask({
        attachments:[
          {
            title: "What would you like to talk about today? You can also say 'Bye Lysa' any time to quit.",
            // (or at any time)
            callback_id: 'initialize_convo',
            color: '#4F3F8B',
            attachment_type: 'default',
            actions: [
              {
                "name":"initial_topic",
                "text": "Assignments",
                "value": "asgmt",
                "type": "button",
              },
              {
                "name":"initial_topic",
                "text": "Course content",
                "value": "course",
                "type": "button",
              },
              {
                "name":"initial_topic",
                "text": "Instructor",
                "value": "instr",
                "type": "button",
              },
              {
                "name":"initial_topic",
                "text": "Miscellaneous",
                "value": "misc",
                "type": "button",
              },
              {
                "name":"initial_topic",
                "text": "Nothing, bye!",
                "value": "done",
                "type": "button",
              }
            ]
          }
        ]
      },[
        {
          pattern: "asgmt",
          callback: function(message, convo) {
            bot.replyInteractive(message, {
              text: '',
              attachments: [
                {
                  title: "What would you like to talk about today?",
                  callback_id: 'initialize_convo',
                  attachment_type: 'default',
                  actions: [
                    {
                      "name":"initial_topic",
                      "text": "Assignments",
                      "type": "button",
                      "style": "danger",
                    }
                  ]
                }
              ]
            });
            // convo.say("This is a regular message");
            // convo.next();
            convo.setVar('topic', "assignments")
            convo.setVar('pt_person', "instructor")
            convo.setVar('pt_topic', "course")
            convo.next()
            convo.gotoThread("on_board_course_special");
          }
        },
        {
          pattern: "course",
          callback: function(message, convo) {
            bot.replyInteractive(message, {
              text: '',
              attachments: [
                {
                  title: "What would you like to talk about today?",
                  callback_id: 'initialize_convo',
                  attachment_type: 'default',
                  actions: [
                    {
                      "name":"initial_topic",
                      "text": "Course content",
                      "type": "button",
                      "style": "danger",
                    }
                  ]
                }
              ]
            });
            convo.next()
            convo.gotoThread("specific_course");
          }
        },
        {
          pattern: "instr",
          callback: function(message, convo) {
            bot.replyInteractive(message, {
              text: '',
              attachments: [
                {
                  title: "What would you like to talk about today?",
                  callback_id: 'initialize_convo',
                  attachment_type: 'default',
                  actions: [
                    {
                      "name":"initial_topic",
                      "text": "Instructor",
                      "type": "button",
                      "style": "danger",
                    }
                  ]
                }
              ]
            });
            convo.setVar('topic', "instructors")
            convo.setVar('pt_person', "instructor")
            convo.setVar('pt_topic', "course")
            convo.next()
            convo.gotoThread("on_board_course");
          }
        },
        {
          pattern: "misc",
          callback: function(message, convo) {
            bot.replyInteractive(message, {
              text: '',
              attachments: [
                {
                  title: "What would you like to talk about today?",
                  callback_id: 'initialize_convo',
                  attachment_type: 'default',
                  actions: [
                    {
                      "name":"initial_topic",
                      "text": "Miscellaneous",
                      "type": "button",
                      "style": "danger",
                    }
                  ]
                }
              ]
            });
            convo.setVar('topic', "miscellaneous")
            convo.next()
            convo.gotoThread("specific_misc");
          }
        },
        {
          pattern: "done",
          callback: function(message, convo) {
            bot.replyInteractive(message, {
              text: '',
              attachments: [
                {
                  title: "What would you like to talk about today?",
                  callback_id: 'initialize_convo',
                  attachment_type: 'default',
                  actions: [
                    {
                      "name":"initial_topic",
                      "text": "Nothing, bye!",
                      "type": "button",
                      "style": "danger",
                    }
                  ]
                }
              ]
            });
            convo.gotoThread("no_bye");
          }
        },
        {
          pattern: "Bye Lysa",
          callback: function(response, convo) {
            convo.gotoThread("no_bye");
          }
        },
        {
          default: true,
          callback: function(reply, convo) {
            convo.say("Didn't quite catch that, sorry!");
            convo.repeat();
            // do nothing
          }
        }
      ]);

      convo.addMessage({
        text: "Let's chat later - ping me anytime by typing 'hi lysa'",
        action: 'completed',
      }, "no_bye");

      convo.addQuestion({
        // text: '',
        attachments:[{
          "title": "OK, which session in particular are you interested in?",
          "color": "#4F3F8B",
          callback_id: 'second_topic',
          actions: [
            {
              "name":"second_topic_0",
              "text": "Async lectures",
              "value": "async",
              "type": "button",
            },
            {
              "name":"second_topic_0",
              "text": "Live session",
              "value": "live_sesh",
              "type": "button",
            }
          ]
        }]
      },[{
        pattern: "async",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: '',
            attachments: [
              {
                title: "OK, which session in particular are you interested in?",
                callback_id: 'second_topic',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"second_topic_0",
                    "text": "Async lectures",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('topic', "async")
          convo.setVar('pt_person', "instructor")
          convo.setVar('pt_topic', "course")
          convo.next()
          convo.gotoThread("on_board_course_special");
        }
      },
      {
        pattern: "live_sesh",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: '',
            attachments: [
              {
                title: "OK, which session in particular are you interested in?",
                callback_id: 'second_topic',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"second_topic_0",
                    "text": "Live session",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('topic', "live session")
          convo.setVar('pt_person', "instructor")
          convo.setVar('pt_topic', "course")
          convo.next()
          convo.gotoThread("on_board_course_special");
        }
      },
      {
        pattern: "Bye Lysa",
        callback: function(response, convo) {
          convo.gotoThread("no_bye");
        }
      },
      {
        default: true,
        callback: function(reply, convo) {
          // do nothing
        }
      },], {}, 'specific_course');

      convo.addQuestion({
        // text: '',
        attachments:[{
          "title": "OK, could you be more specific?",
          "color": "#4F3F8B",
          callback_id: 'third_topic',
          actions: [
            {
              "name":"third_topic_0",
              "text": "Admin",
              "value": "admin",
              "type": "button",
            },
            {
              "name":"third_topic_0",
              "text": "Student support",
              "value": "student_spprt",
              "type": "button",
            },
            {
              "name":"third_topic_0",
              "text": "Technology",
              "value": "tech",
              "type": "button",
            },
            {
              "name":"third_topic_0",
              "text": "Other",
              "value": "other",
              "type": "button",
            }
          ]
        }]
      },[{
        pattern: "admin",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: '',
            attachments: [
              {
                title: "OK, could you be more specific?",
                callback_id: 'third_topic',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"third_topic_0",
                    "text": "Admin",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('topic', "admin")
          convo.setVar('pt_person', "instructor or point of contact")
          convo.setVar('pt_topic', "course or specific topic")
          convo.next()
          convo.gotoThread("on_board_course");
        }
      },
      {
        pattern: "student_spprt",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: '',
            attachments: [
              {
                title: "OK, could you be more specific?",
                callback_id: 'third_topic_0',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"third_topic",
                    "text": "Student support",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('topic', "student support")
          convo.setVar('pt_person', "instructor or point of contact")
          convo.setVar('pt_topic', "course or specific topic")
          convo.next()
          convo.gotoThread("on_board_course");
        }
      },
      {
        pattern: "tech",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: '',
            attachments: [
              {
                title: "OK, could you be more specific?",
                callback_id: 'third_topic_0',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"third_topic",
                    "text": "Technology",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('topic', "technology")
          convo.setVar('pt_person', "instructor or point of contact")
          convo.setVar('pt_topic', "course or specific topic")
          convo.next()
          convo.gotoThread("on_board_course");
        }
      },
      {
        pattern: "other",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: '',
            attachments: [
              {
                title: "OK, could you be more specific?",
                callback_id: 'third_topic_0',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"third_topic",
                    "text": "Other",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('topic', "other")
          convo.setVar('pt_person', "instructor or point of contact")
          convo.setVar('pt_topic', "course or specific topic")
          convo.next()
          convo.gotoThread("on_board_course");
        }
      },
      {
        pattern: "Bye Lysa",
        callback: function(response, convo) {
          convo.gotoThread("no_bye");
        }
      },
      {
        default: true,
        callback: function(reply, convo) {
          // do nothing
        }
      },], {}, 'specific_misc');

      convo.addQuestion({
        text: 'OK, let me get some information from you before getting started. What specific {{vars.pt_topic}} is this feedback on "{{vars.topic}}" referring to?',
        attachments:[{
          "title": 'Please provide the course number, e.g. "201"',
          "color": "#4F3F8B",
          callback_id: 'course_num_selection',
          actions: [
            {
              "name":"course_num",
              "text": "Choose a course..",
              "type": "select",
              "options": [
                {
                  "text": "200",
                  "value": "200"
                },
                {
                  "text": "201",
                  "value": "201"
                },
                {
                  "text": "203",
                  "value": "203"
                },
                {
                  "text": "205",
                  "value": "205"
                },
                {
                  "text": "207",
                  "value": "207"
                },
                {
                  "text": "209",
                  "value": "209"
                },
                {
                  "text": "210",
                  "value": "210"
                },
                {
                  "text": "231",
                  "value": "231"
                },
                {
                  "text": "241",
                  "value": "241"
                },
                {
                  "text": "251",
                  "value": "251"
                },
                {
                  "text": "261",
                  "value": "261"
                },
                {
                  "text": "271",
                  "value": "271"
                }
              ]
            }
          ]
        }]
      },[{
        pattern: "200",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'Please provide the course number, e.g. "201"',
                callback_id: 'course_num_selection',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"course_num",
                    "text": "200",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('course', "200")
          convo.next()
          convo.gotoThread("on_board_prof");
        }
      },
      {
        pattern: "201",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'Please provide the course number, e.g. "201"',
                callback_id: 'course_num_selection',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"course_num",
                    "text": "201",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('course', "201")
          convo.next()
          convo.gotoThread("on_board_prof");
        }
      },
      {
        pattern: "203",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'Please provide the course number, e.g. "201"',
                callback_id: 'course_num_selection',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"course_num",
                    "text": "203",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('course', "203")
          convo.next()
          convo.gotoThread("on_board_prof");
        }
      },
      {
        pattern: "205",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'Please provide the course number, e.g. "201"',
                callback_id: 'course_num_selection',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"course_num",
                    "text": "205",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('course', "205")
          convo.next()
          convo.gotoThread("on_board_prof");
        }
      },
      {
        pattern: "207",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'Please provide the course number, e.g. "201"',
                callback_id: 'course_num_selection',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"course_num",
                    "text": "207",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('course', "207")
          convo.next()
          convo.gotoThread("on_board_prof");
        }
      },
      {
        pattern: "209",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'Please provide the course number, e.g. "201"',
                callback_id: 'course_num_selection',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"course_num",
                    "text": "209",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('course', "209")
          convo.next()
          convo.gotoThread("on_board_prof");
        }
      },
      {
        pattern: "210",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'Please provide the course number, e.g. "201"',
                callback_id: 'course_num_selection',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"course_num",
                    "text": "210",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('course', "210")
          convo.next()
          convo.gotoThread("on_board_prof");
        }
      },
      {
        pattern: "231",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'Please provide the course number, e.g. "201"',
                callback_id: 'course_num_selection',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"course_num",
                    "text": "231",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('course', "231")
          convo.next()
          convo.gotoThread("on_board_prof");
        }
      },
      {
        pattern: "241",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'Please provide the course number, e.g. "201"',
                callback_id: 'course_num_selection',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"course_num",
                    "text": "241",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('course', "241")
          convo.next()
          convo.gotoThread("on_board_prof");
        }
      },
      {
        pattern: "251",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'Please provide the course number, e.g. "201"',
                callback_id: 'course_num_selection',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"course_num",
                    "text": "251",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('course', "251")
          convo.next()
          convo.gotoThread("on_board_prof");
        }
      },
      {
        pattern: "261",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'Please provide the course number, e.g. "201"',
                callback_id: 'course_num_selection',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"course_num",
                    "text": "261",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('course', "261")
          convo.next()
          convo.gotoThread("on_board_prof");
        }
      },
      {
        pattern: "266",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'Please provide the course number, e.g. "201"',
                callback_id: 'course_num_selection',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"course_num",
                    "text": "266",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('course', "266")
          convo.next()
          convo.gotoThread("on_board_prof");
        }
      },
      {
        pattern: "271",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'Please provide the course number, e.g. "201"',
                callback_id: 'course_num_selection',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"course_num",
                    "text": "271",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('course', "271")
          convo.next()
          convo.gotoThread("on_board_prof");
        }
      },
      {
        pattern: "Bye Lysa",
        callback: function(response, convo) {
          convo.gotoThread("no_bye");
        }
      },
      {
        default: true,
        callback: function(reply, convo) {
          // do nothing
        }
      },], {}, 'on_board_course');

      convo.addQuestion({
        text: 'OK, let me get some information from you before getting started. What specific {{vars.pt_topic}} is this feedback on "{{vars.topic}}" referring to?',
        attachments:[{
          "title": 'Please provide the course number, e.g. "201"',
          "color": "#4F3F8B",
          callback_id: 'course_num_selection',
          actions: [
            {
              "name":"course_num",
              "text": "Choose a course..",
              "type": "select",
              "options": [
                {
                  "text": "200",
                  "value": "200"
                },
                {
                  "text": "201",
                  "value": "201"
                },
                {
                  "text": "203",
                  "value": "203"
                },
                {
                  "text": "205",
                  "value": "205"
                },
                {
                  "text": "207",
                  "value": "207"
                },
                {
                  "text": "209",
                  "value": "209"
                },
                {
                  "text": "210",
                  "value": "210"
                },
                {
                  "text": "231",
                  "value": "231"
                },
                {
                  "text": "241",
                  "value": "241"
                },
                {
                  "text": "251",
                  "value": "251"
                },
                {
                  "text": "261",
                  "value": "261"
                },
                {
                  "text": "271",
                  "value": "271"
                }
              ]
            }
          ]
        }]
      },[{
        pattern: "200",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'Please provide the course number, e.g. "201"',
                callback_id: 'course_num_selection',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"course_num",
                    "text": "200",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('course', "200")
          convo.next()
          convo.gotoThread("on_board_prof_special");
        }
      },
      {
        pattern: "201",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'Please provide the course number, e.g. "201"',
                callback_id: 'course_num_selection',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"course_num",
                    "text": "201",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('course', "201")
          convo.next()
          convo.gotoThread("on_board_prof_special");
        }
      },
      {
        pattern: "203",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'Please provide the course number, e.g. "201"',
                callback_id: 'course_num_selection',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"course_num",
                    "text": "203",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('course', "203")
          convo.next()
          convo.gotoThread("on_board_prof_special");
        }
      },
      {
        pattern: "205",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'Please provide the course number, e.g. "201"',
                callback_id: 'course_num_selection',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"course_num",
                    "text": "205",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('course', "205")
          convo.next()
          convo.gotoThread("on_board_prof_special");
        }
      },
      {
        pattern: "207",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'Please provide the course number, e.g. "201"',
                callback_id: 'course_num_selection',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"course_num",
                    "text": "207",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('course', "207")
          convo.next()
          convo.gotoThread("on_board_prof_special");
        }
      },
      {
        pattern: "209",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'Please provide the course number, e.g. "201"',
                callback_id: 'course_num_selection',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"course_num",
                    "text": "209",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('course', "209")
          convo.next()
          convo.gotoThread("on_board_prof_special");
        }
      },
      {
        pattern: "210",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'Please provide the course number, e.g. "201"',
                callback_id: 'course_num_selection',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"course_num",
                    "text": "210",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('course', "210")
          convo.next()
          convo.gotoThread("on_board_prof_special");
        }
      },
      {
        pattern: "231",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'Please provide the course number, e.g. "201"',
                callback_id: 'course_num_selection',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"course_num",
                    "text": "231",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('course', "231")
          convo.next()
          convo.gotoThread("on_board_prof_special");
        }
      },
      {
        pattern: "241",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'Please provide the course number, e.g. "201"',
                callback_id: 'course_num_selection',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"course_num",
                    "text": "241",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('course', "241")
          convo.next()
          convo.gotoThread("on_board_prof_special");
        }
      },
      {
        pattern: "251",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'Please provide the course number, e.g. "201"',
                callback_id: 'course_num_selection',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"course_num",
                    "text": "251",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('course', "251")
          convo.next()
          convo.gotoThread("on_board_prof_special");
        }
      },
      {
        pattern: "261",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'Please provide the course number, e.g. "201"',
                callback_id: 'course_num_selection',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"course_num",
                    "text": "261",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('course', "261")
          convo.next()
          convo.gotoThread("on_board_prof_special");
        }
      },
      {
        pattern: "266",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'Please provide the course number, e.g. "201"',
                callback_id: 'course_num_selection',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"course_num",
                    "text": "266",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('course', "266")
          convo.next()
          convo.gotoThread("on_board_prof_special");
        }
      },
      {
        pattern: "271",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'Please provide the course number, e.g. "201"',
                callback_id: 'course_num_selection',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"course_num",
                    "text": "271",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('course', "271")
          convo.next()
          convo.gotoThread("on_board_prof_special");
        }
      },
      {
        pattern: "Bye Lysa",
        callback: function(response, convo) {
          convo.gotoThread("no_bye");
        }
      },
      {
        default: true,
        callback: function(reply, convo) {
          // do nothing
        }
      },], {}, 'on_board_course_special');

      convo.addQuestion('*Who is your {{vars.course}} {{vars.pt_person}}?* Please provide their first and last name, e.g. "Jane Smith"', function(response, convo) {
        if (response.text == "Bye Lysa"){
          convo.gotoThread("no_bye");
        } else {
          convo.setVar('prof_name', response.text)
          convo.next()
          convo.gotoThread('topic_emoji_rate')
        }
      }, {key: 'ProfName'}, 'on_board_prof');

      convo.addQuestion('*Who is your {{vars.course}} {{vars.pt_person}}?* Please provide their first and last name, e.g. "Jane Smith"', function(response, convo) {
        if (response.text == "Bye Lysa"){
          convo.gotoThread("no_bye");
        } else {
          convo.setVar('prof_name', response.text)
          convo.next()
          convo.gotoThread('on_board_class_expectation')
        }
      }, {key: 'ProfName'}, 'on_board_prof_special');

      convo.addQuestion({
        text: '',
        attachments:[{
          "title": 'How many hours each week did you expect to spend on this course, including both async and assignments?',
          "color": "#4F3F8B",
          callback_id: 'num_hrs_spent',
          attachment_type: 'default',
          actions: [
            {
              "name":"num_hrs",
              "text": "0-5",
              "value": "0-5",
              "type": "button",
            },
            {
              "name":"num_hrs",
              "text": "6-10",
              "value": "6-10",
              "type": "button",
            },
            {
              "name":"num_hrs",
              "text": "11-15",
              "value": "11-15",
              "type": "button",
            },
            {
              "name":"num_hrs",
              "text": "16-20",
              "value": "16-20",
              "type": "button",
            },
            {
              "name":"num_hrs",
              "text": "20+",
              "value": "20+",
              "type": "button",
            }
          ]

        }]
      },[{
        pattern: "0-5",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'How many hours each week did you expect to spend on this course?',
                callback_id: 'num_hrs_spent',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"num_hrs",
                    "text": "0-5",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('expected_hrs', "0-5")
          convo.next()
          convo.gotoThread("topic_emoji_rate");
        }
      },
      {
        pattern: "6-10",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'How many hours each week did you expect to spend on this course?',
                callback_id: 'num_hrs_spent',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"num_hrs",
                    "text": "6-10",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('expected_hrs', "6-10")
          convo.next()
          convo.gotoThread("topic_emoji_rate");
        }
      },
      {
        pattern: "11-15",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'How many hours each week did you expect to spend on this course?',
                callback_id: 'num_hrs_spent',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"num_hrs",
                    "text": "11-15",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('expected_hrs', "11-15")
          convo.next()
          convo.gotoThread("topic_emoji_rate");
        }
      },
      {
        pattern: "16-20",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'How many hours each week did you expect to spend on this course?',
                callback_id: 'num_hrs_spent',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"num_hrs",
                    "text": "16-20",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('expected_hrs', "16-20")
          convo.next()
          convo.gotoThread("topic_emoji_rate");
        }
      },
      {
        pattern: "20+",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'How many hours each week did you expect to spend on this course?',
                callback_id: 'num_hrs_spent',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"num_hrs",
                    "text": "20+",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('expected_hrs', "20+")
          convo.next()
          convo.gotoThread("topic_emoji_rate");
        }
      },
      {
        pattern: "Bye Lysa",
        callback: function(response, convo) {
          convo.gotoThread("no_bye");
        }
      },
      {
        default: true,
        callback: function(reply, convo) {
          // do nothing
        }
      },], {}, 'on_board_class_expectation');


      convo.addQuestion({
        text: 'Great, thank you for the information.',
        attachments:[{
          "title": "What is your overall experience with {{vars.topic}} in {{vars.course}}?",
          "color": "#4F3F8B",
          callback_id: 'topic_emoji_sentiment',
          actions: [
            {
              "name":"emoji_sentiment",
              "text": ":grinning:",
              "value": "1pos",
              "type": "button",
            },
            {
              "name":"emoji_sentiment",
              "text": ":simple_smile:",
              "value": "pos",
              "type": "button",
            },
            {
              "name":"emoji_sentiment",
              "text": ":neutral_face:",
              "value": "neu",
              "type": "button",
            },
            {
              "name":"emoji_sentiment",
              "text": ":disappointed:",
              "value": "neg",
              "type": "button",
            },
            {
              "name":"emoji_sentiment",
              "text": ":tired_face:",
              "value": "1neg",
              "type": "button",
            }
          ]
        }]
      },[{
        pattern: "1pos",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "Great, thank you for the information.",
            attachments: [
              {
                title: 'What is your overall experience?',
                callback_id: 'topic_emoji_sentiment',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"emoji_sentiment",
                    "text": ":grinning:",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('emoji_rating', "pos1");
          convo.setVar('emoji_response', "That is fantastic!")
          convo.next();
          convo.gotoThread("topic_text_response_i");
        }
      },
      {
        pattern: "pos",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "Great, thank you for the information.",
            attachments: [
              {
                title: 'What is your overall experience?',
                callback_id: 'topic_emoji_sentiment',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"emoji_sentiment",
                    "text": ":simple_smile:",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('emoji_rating', "pos");
          convo.setVar('emoji_response', "Great!")
          convo.next();
          convo.gotoThread("topic_text_response_i");
        }
      },
      {
        pattern: "neu",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "Great, thank you for the information.",
            attachments: [
              {
                title: 'What is your overall experience?',
                callback_id: 'topic_emoji_sentiment',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"emoji_sentiment",
                    "text": ":neutral_face:",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('emoji_rating', "neu");
          convo.setVar('emoji_response', "Okay.")
          convo.next();
          convo.gotoThread("topic_text_response_i");
        }
      },
      {
        pattern: "neg",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "Great, thank you for the information.",
            attachments: [
              {
                title: 'What is your overall experience?',
                callback_id: 'topic_emoji_sentiment',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"emoji_sentiment",
                    "text": ":disappointed:",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('emoji_rating', "neg");
          convo.setVar('emoji_response', "I am sorry to hear that.")
          convo.next();
          convo.gotoThread("topic_text_response_i");
        }
      },
      {
        pattern: "1neg",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "Great, thank you for the information.",
            attachments: [
              {
                title: 'What is your overall experience?',
                callback_id: 'topic_emoji_sentiment',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"emoji_sentiment",
                    "text": ":tired_face:",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('emoji_rating', "neg1");
          convo.setVar('emoji_response', "That is unfortunate, I am sorry to hear that.")
          convo.next();
          convo.gotoThread("topic_text_response_i");
        }
      },
      {
        pattern: "Bye Lysa",
        callback: function(response, convo) {
          convo.gotoThread("no_bye");
        }
      },
      {
        default: true,
        callback: function(reply, convo) {
          convo.say("Didn't quite catch that, sorry!");
          convo.repeat();
        }
      },], {key: 'EmojiSentiment'}, 'topic_emoji_rate');

      convo.addQuestion('{{vars.emoji_response}} *What is working well related to "{{vars.topic}}"?* E.g. "The instructions for each assignment have been very clear, which has helped keep me on the right track as I worked through each one." Please make sure to send one long text message rather than several short messages, thank you!', function(response, convo) {
        if (response.text == "Bye Lysa"){
          convo.gotoThread("no_bye");
        } else {
          convo.setVar('response_working_well', response.text)
          convo.gotoThread('topic_text_response_i1');
        }
      }, {key: 'TopicResponse'}, 'topic_text_response_i');

      convo.addQuestion('*What would you change related to "{{vars.topic}}" to improve {{vars.course}}?* E.g. "It would be great to get feedback on assignments sooner, so I could learn from my mistakes and apply that to future assignments before they’re due."', function(response, convo) {
        if (response.text == "Bye Lysa"){
          convo.gotoThread("no_bye");
        } else {
          convo.setVar('response_needs_improvement', response.text)
          convo.gotoThread('topic_text_response_i2');
        }
      }, {key: 'TopicResponse'}, 'topic_text_response_i1');

      convo.addQuestion('*Do you have any other feedback for {{vars.pt_person}}, specifically related to "{{vars.topic}}" for {{vars.course}}?* E.g. "The links to assignments in ISVC are broken."', function(response, convo) {
        if (response.text == "Bye Lysa"){
          convo.gotoThread("no_bye");
        } else {
          convo.setVar('response_addl_feedback', response.text)
          convo.gotoThread('topic_text_response_i3');
        }
      }, {key: 'TopicResponse'}, 'topic_text_response_i2');

      convo.addQuestion({
        text: '',
        attachments:[{
          "title": 'On a scale from 1 = not at all valuable to 7 = most valuable, how valuable do you consider this component of the course?',
          "color": "#4F3F8B",
          callback_id: 'final_scale',
          actions: [
            {
              "name":"final_scale_17",
              "text": "Choose a rating..",
              "type": "select",
              "options": [
                {
                  "text": "1",
                  "value": "1"
                },
                {
                  "text": "2",
                  "value": "2"
                },
                {
                  "text": "3",
                  "value": "3"
                },
                {
                  "text": "4",
                  "value": "4"
                },
                {
                  "text": "5",
                  "value": "5"
                },
                {
                  "text": "6",
                  "value": "6"
                },
                {
                  "text": "7",
                  "value": "7"
                }
              ]
            }
          ]
        }]
      },[{
        pattern: "1",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'On a scale from 1 to 7, how valuable do you consider this component of the course?',
                callback_id: 'final_scale',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"final_scale_17",
                    "text": "1",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('scale', "1")
          convo.next()
          convo.gotoThread("additional_loop");
        }
      },
      {
        pattern: "2",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'On a scale from 1 to 7, how valuable do you consider this component of the course?',
                callback_id: 'final_scale',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"final_scale_17",
                    "text": "2",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('scale', "2")
          convo.next()
          convo.gotoThread("additional_loop");
        }
      },
      {
        pattern: "3",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'On a scale from 1 to 7, how valuable do you consider this component of the course?',
                callback_id: 'final_scale',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"final_scale_17",
                    "text": "3",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('scale', "3")
          convo.next()
          convo.gotoThread("additional_loop");
        }
      },
      {
        pattern: "4",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'On a scale from 1 to 7, how valuable do you consider this component of the course?',
                callback_id: 'final_scale',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"final_scale_17",
                    "text": "4",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('scale', "4")
          convo.next()
          convo.gotoThread("additional_loop");
        }
      },
      {
        pattern: "5",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'On a scale from 1 to 7, how valuable do you consider this component of the course?',
                callback_id: 'final_scale',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"final_scale_17",
                    "text": "5",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('scale', "5")
          convo.next()
          convo.gotoThread("additional_loop");
        }
      },
      {
        pattern: "6",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'On a scale from 1 to 7, how valuable do you consider this component of the course?',
                callback_id: 'final_scale',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"final_scale_17",
                    "text": "6",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('scale', "6")
          convo.next()
          convo.gotoThread("additional_loop");
        }
      },
      {
        pattern: "7",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: "",
            attachments: [
              {
                title: 'On a scale from 1 to 7, how valuable do you consider this component of the course?',
                callback_id: 'final_scale',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"final_scale_17",
                    "text": "7",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('scale', "7")
          convo.next()
          convo.gotoThread("additional_loop");
        }
      },
      {
        pattern: "Bye Lysa",
        callback: function(response, convo) {
          convo.gotoThread("no_bye");
        }
      },
      {
        default: true,
        callback: function(reply, convo) {
          // do nothing
        }
      },], {}, 'topic_text_response_i3');

      convo.addQuestion({
        text: "Thank you! I'll pass that feedback along.",
        attachments:[{
          "title": "Is there anything else you'd like to talk about today?",
          "color": "#4F3F8B",
          callback_id: 'addl_loop',
          actions: [
            {
              "name": "loop_answer",
              "text": ":thumbsup:",
              "value": "yes",
              "type": "button",
            },
            {
              "name": "loop_answer",
              "text": ":thumbsdown:",
              "value": "no",
              "type": "button",
            }
          ]
        }]
      }, [
        {
          pattern: "yes",
          callback: function(message, convo) {
            bot.replyInteractive(message, {
              text: "Thank you! I'll pass that feedback along.",
              attachments: [
                {
                  title: "Is there anything else you'd like to talk about today?",
                  callback_id: 'addl_loop',
                  attachment_type: 'default',
                  actions: [
                    {
                      "name":"loop_answer",
                      "text": ":thumbsup:",
                      "type": "button",
                      "style": "danger",
                    }
                  ]
                }
              ]
            });
            convo.next()
            convo.gotoThread("check_same_topic");
          }
        },
        {
          pattern: "no",
          callback: function(message, convo) {
            bot.replyInteractive(message, {
              text: "Thank you! I'll pass that feedback along.",
              attachments: [
                {
                  title: "Is there anything else you'd like to talk about today?",
                  callback_id: 'addl_loop',
                  attachment_type: 'default',
                  actions: [
                    {
                      "name":"loop_answer",
                      "text": ":thumbsdown:",
                      "type": "button",
                      "style": "danger",
                    }
                  ]
                }
              ]
            });
            convo.next()
            convo.gotoThread("end_chat");
          }
        },
        {
          pattern: "Bye Lysa",
          callback: function(response, convo) {
            convo.gotoThread("no_bye");
          }
        }
      ], {key: 'AdditionalLoop'}, 'additional_loop')

      convo.addQuestion({
        text: "",
        attachments:[{
          "title": "OK. Is this regarding the same course and instructor?",
          "color": "#4F3F8B",
          callback_id: 'same_course_prof',
          actions: [
            {
              "name": "same_topic",
              "text": ":thumbsup:",
              "value": "yes",
              "type": "button",
            },
            {
              "name": "same_topic",
              "text": ":thumbsdown:",
              "value": "no",
              "type": "button",
            }
          ]
        }]
      }, [
        {
          pattern: "yes",
          callback: function(message, convo) {
            bot.replyInteractive(message, {
              text: "",
              attachments: [
                {
                  title: "OK. Is this regarding the same course and instructor?",
                  callback_id: 'same_course_prof',
                  attachment_type: 'default',
                  actions: [
                    {
                      "name":"same_topic",
                      "text": ":thumbsup:",
                      "type": "button",
                      "style": "danger",
                    }
                  ]
                }
              ]
            });
            convo.next()
            convo.gotoThread("additional_topic");
          }
        },
        {
          pattern: "no",
          callback: function(message, convo) {
            bot.replyInteractive(message, {
              text: "",
              attachments: [
                {
                  title: "OK. Is this regarding the same course and instructor?",
                  callback_id: 'same_course_prof',
                  attachment_type: 'default',
                  actions: [
                    {
                      "name":"same_topic",
                      "text": ":thumbsdown:",
                      "type": "button",
                      "style": "danger",
                    }
                  ]
                }
              ]
            });
            convo.next()
            convo.gotoThread("additional_topic1");
          }
        },
        {
          pattern: "Bye Lysa",
          callback: function(response, convo) {
            convo.gotoThread("no_bye");
          }
        }
      ], {key: 'CheckSameTopic'}, 'check_same_topic')

      convo.addQuestion({
        text: 'OK.',
        attachments:[{
          "title": "Please choose a topic you'd like to talk about. Additionally, you can type 'Bye Lysa' anytime to end our conversation.",
          "color": "#4F3F8B",
          callback_id: 'additional_convo',
          actions: [
            {
              "name":"initial_topic_1",
              "text": "Assignments",
              "value": "asgmt",
              "type": "button",
            },
            {
              "name":"initial_topic_1",
              "text": "Course content",
              "value": "course",
              "type": "button",
            },
            {
              "name":"initial_topic_1",
              "text": "Instructor",
              "value": "instr",
              "type": "button",
            },
            {
              "name":"initial_topic_1",
              "text": "Miscellaneous",
              "value": "misc",
              "type": "button",
            },
            {
              "name":"initial_topic_1",
              "text": "No thanks, bye!",
              "value": "done",
              "type": "button",
            }
          ]
        }
      ]
    },[
      {
        pattern: "asgmt",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: '',
            attachments: [
              {
                title: "What would you like to talk about today?",
                callback_id: 'additional_convo',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"initial_topic_1",
                    "text": "Assignments",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('topic', "assignments")
          convo.next()
          convo.gotoThread("topic_emoji_rate");
        }
      },
      {
        pattern: "course",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: '',
            attachments: [
              {
                title: "What would you like to talk about?",
                callback_id: 'additional_convo',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"initial_topic_1",
                    "text": "Course content",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.next()
          convo.gotoThread("specific_course1");
        }
      },
      {
        pattern: "instr",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: '',
            attachments: [
              {
                title: "What would you like to talk about today?",
                callback_id: 'additional_convo',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"initial_topic_1",
                    "text": "Instructor",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.setVar('topic', "instructors")
          convo.next()
          convo.gotoThread("topic_emoji_rate");
        }
      },
      {
        pattern: "misc",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: '',
            attachments: [
              {
                title: "What would you like to talk about today?",
                callback_id: 'additional_convo',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"initial_topic_1",
                    "text": "Miscellaneous",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.next()
          convo.gotoThread("specific_misc1");
        }
      },
      {
        pattern: "done",
        callback: function(message, convo) {
          bot.replyInteractive(message, {
            text: '',
            attachments: [
              {
                title: "What would you like to talk about today?",
                callback_id: 'additional_convo',
                attachment_type: 'default',
                actions: [
                  {
                    "name":"initial_topic_1",
                    "text": "Nothing, bye!",
                    "type": "button",
                    "style": "danger",
                  }
                ]
              }
            ]
          });
          convo.gotoThread("no_bye");
        }
      },
      {
        pattern: "Bye Lysa",
        callback: function(response, convo) {
          convo.gotoThread("no_bye");
        }
      },
      {
        default: true,
        callback: function(reply, convo) {
          convo.say("Didn't quite catch that, sorry!");
          convo.repeat();
          // do nothing
        }
      }
    ], {key: 'AdditionalTopic'}, 'additional_topic')

    convo.addQuestion({
      text: 'OK.',
      attachments:[{
        "title": "Please choose a topic you'd like to talk about. Additionally, you can type 'done' to end our conversation.",
        "color": "#4F3F8B",
        callback_id: 'additional_convo',
        actions: [
          {
            "name":"initial_topic_2",
            "text": "Assignments",
            "value": "asgmt",
            "type": "button",
          },
          {
            "name":"initial_topic_2",
            "text": "Course content",
            "value": "course",
            "type": "button",
          },
          {
            "name":"initial_topic_2",
            "text": "Instructor",
            "value": "instr",
            "type": "button",
          },
          {
            "name":"initial_topic_2",
            "text": "Miscellaneous",
            "value": "misc",
            "type": "button",
          },
          {
            "name":"initial_topic_2",
            "text": "No thanks, bye!",
            "value": "done",
            "type": "button",
          }
        ]
      }
    ]
  },[
    {
      pattern: "asgmt",
      callback: function(message, convo) {
        bot.replyInteractive(message, {
          text: '',
          attachments: [
            {
              title: "What would you like to talk about today?",
              callback_id: 'initialize_convo',
              attachment_type: 'default',
              actions: [
                {
                  "name":"initial_topic",
                  "text": "Assignments",
                  "type": "button",
                  "style": "danger",
                }
              ]
            }
          ]
        });
        // convo.say("This is a regular message");
        // convo.next();
        convo.setVar('topic', "assignments")
        convo.setVar('pt_person', "instructor")
        convo.setVar('pt_topic', "course")
        convo.next()
        convo.gotoThread("on_board_course_special");
      }
    },
    {
      pattern: "course",
      callback: function(message, convo) {
        bot.replyInteractive(message, {
          text: '',
          attachments: [
            {
              title: "What would you like to talk about today?",
              callback_id: 'initialize_convo',
              attachment_type: 'default',
              actions: [
                {
                  "name":"initial_topic",
                  "text": "Course content",
                  "type": "button",
                  "style": "danger",
                }
              ]
            }
          ]
        });
        convo.next()
        convo.gotoThread("specific_course");
      }
    },
    {
      pattern: "instr",
      callback: function(message, convo) {
        bot.replyInteractive(message, {
          text: '',
          attachments: [
            {
              title: "What would you like to talk about today?",
              callback_id: 'initialize_convo',
              attachment_type: 'default',
              actions: [
                {
                  "name":"initial_topic",
                  "text": "Instructor",
                  "type": "button",
                  "style": "danger",
                }
              ]
            }
          ]
        });
        convo.setVar('topic', "instructors")
        convo.setVar('pt_person', "instructor")
        convo.setVar('pt_topic', "course")
        convo.next()
        convo.gotoThread("on_board_course");
      }
    },
    {
      pattern: "misc",
      callback: function(message, convo) {
        bot.replyInteractive(message, {
          text: '',
          attachments: [
            {
              title: "What would you like to talk about today?",
              callback_id: 'initialize_convo',
              attachment_type: 'default',
              actions: [
                {
                  "name":"initial_topic",
                  "text": "Miscellaneous",
                  "type": "button",
                  "style": "danger",
                }
              ]
            }
          ]
        });
        convo.setVar('topic', "miscellaneous")
        convo.next()
        convo.gotoThread("specific_misc");
      }
    },
    {
      pattern: "done",
      callback: function(message, convo) {
        bot.replyInteractive(message, {
          text: '',
          attachments: [
            {
              title: "What would you like to talk about today?",
              callback_id: 'initialize_convo',
              attachment_type: 'default',
              actions: [
                {
                  "name":"initial_topic",
                  "text": "Nothing, bye!",
                  "type": "button",
                  "style": "danger",
                }
              ]
            }
          ]
        });
        convo.gotoThread("no_bye");
      }
    },
    {
      pattern: "Bye Lysa",
      callback: function(response, convo) {
        convo.gotoThread("no_bye");
      }
    },
    {
      default: true,
      callback: function(reply, convo) {
        convo.say("Didn't quite catch that, sorry!");
        convo.repeat();
        // do nothing
      }
    }
  ], {key: 'AdditionalTopic1'}, 'additional_topic1')

  convo.addQuestion({
    // text: '',
    attachments:[{
      "title": "OK, which session in particular are you interested in?",
      "color": "#4F3F8B",
      callback_id: 'additional_second_topic',
      actions: [
        {
          "name":"second_topic_1",
          "text": "Async lectures",
          "value": "async",
          "type": "button",
        },
        {
          "name":"second_topic_1",
          "text": "Live session",
          "value": "live_sesh",
          "type": "button",
        }
      ]
    }]
  },[{
    pattern: "async",
    callback: function(message, convo) {
      bot.replyInteractive(message, {
        text: '',
        attachments: [
          {
            title: "OK, which session in particular are you interested in?",
            callback_id: 'additional_second_topic',
            attachment_type: 'default',
            actions: [
              {
                "name":"second_topic_1",
                "text": "Async lectures",
                "type": "button",
                "style": "danger",
              }
            ]
          }
        ]
      });
      convo.setVar('topic', "async")
      convo.next()
      convo.gotoThread("topic_emoji_rate");
    }
  },
  {
    pattern: "live_sesh",
    callback: function(message, convo) {
      bot.replyInteractive(message, {
        text: '',
        attachments: [
          {
            title: "OK, which session in particular are you interested in?",
            callback_id: 'additional_second_topic',
            attachment_type: 'default',
            actions: [
              {
                "name":"second_topic_1",
                "text": "Live session",
                "type": "button",
                "style": "danger",
              }
            ]
          }
        ]
      });
      convo.setVar('topic', "live session")
      convo.next()
      convo.gotoThread("topic_emoji_rate");
    }
  },
  {
    pattern: "Bye Lysa",
    callback: function(response, convo) {
      convo.gotoThread("no_bye");
    }
  },
  {
    default: true,
    callback: function(reply, convo) {
      // do nothing
    }
  },], {}, 'specific_course1');

  convo.addQuestion({
    // text: '',
    attachments:[{
      "title": "OK, could you be more specific?",
      "color": "#4F3F8B",
      callback_id: 'additional_third_topic',
      actions: [
        {
          "name":"third_topic_1",
          "text": "Admin",
          "value": "admin",
          "type": "button",
        },
        {
          "name":"third_topic_1",
          "text": "Student support",
          "value": "student_spprt",
          "type": "button",
        },
        {
          "name":"third_topic_1",
          "text": "Technology",
          "value": "tech",
          "type": "button",
        },
        {
          "name":"third_topic_1",
          "text": "Other",
          "value": "other",
          "type": "button",
        }
      ]
    }]
  },[{
    pattern: "admin",
    callback: function(message, convo) {
      bot.replyInteractive(message, {
        text: '',
        attachments: [
          {
            title: "OK, could you be more specific?",
            callback_id: 'additional_third_topic',
            attachment_type: 'default',
            actions: [
              {
                "name":"third_topic_1",
                "text": "Admin",
                "type": "button",
                "style": "danger",
              }
            ]
          }
        ]
      });
      convo.setVar('topic', "admin")
      convo.next()
      convo.gotoThread("topic_emoji_rate");
    }
  },
  {
    pattern: "student_spprt",
    callback: function(message, convo) {
      bot.replyInteractive(message, {
        text: '',
        attachments: [
          {
            title: "OK, could you be more specific?",
            callback_id: 'additional_third_topic',
            attachment_type: 'default',
            actions: [
              {
                "name":"third_topic_1",
                "text": "Student support",
                "type": "button",
                "style": "danger",
              }
            ]
          }
        ]
      });
      convo.setVar('topic', "student support")
      convo.next()
      convo.gotoThread("topic_emoji_rate");
    }
  },
  {
    pattern: "tech",
    callback: function(message, convo) {
      bot.replyInteractive(message, {
        text: '',
        attachments: [
          {
            title: "OK, could you be more specific?",
            callback_id: 'additional_third_topic',
            attachment_type: 'default',
            actions: [
              {
                "name":"third_topic_1",
                "text": "Technology",
                "type": "button",
                "style": "danger",
              }
            ]
          }
        ]
      });
      convo.setVar('topic', "technology")
      convo.next()
      convo.gotoThread("topic_emoji_rate");
    }
  },
  {
    pattern: "other",
    callback: function(message, convo) {
      bot.replyInteractive(message, {
        text: '',
        attachments: [
          {
            title: "OK, could you be more specific?",
            callback_id: 'additional_third_topic',
            attachment_type: 'default',
            actions: [
              {
                "name":"third_topic_1",
                "text": "Other",
                "type": "button",
                "style": "danger",
              }
            ]
          }
        ]
      });
      convo.setVar('topic', "other")
      convo.next()
      convo.gotoThread("topic_emoji_rate");
    }
  },
  {
    pattern: "Bye Lysa",
    callback: function(response, convo) {
      convo.gotoThread("no_bye");
    }
  },
  {
    default: true,
    callback: function(reply, convo) {
      // do nothing
    }
  },], {}, 'specific_misc1');

  convo.beforeThread(
    "additional_loop",
    addDataInDB);

    convo.addMessage({
      text: 'Awesome. Thank you for sharing your feedback with me today. Have a great rest of your day!',
      action: 'completed',
    }, "end_chat");

    convo.activate();

    convo.setTimeout(360000)
    convo.addMessage('Oh no! The time limit has expired.','on_timeout');
    convo.addMessage("Let's chat later - ping me anytime by typing 'hi lysa'",'on_timeout');

  })

});
}
