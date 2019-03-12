var user_id = 'anon'
var current_time = Date()
const vader = require('vader-sentiment');

function identifySentiment(user_response) {
  var intensity = vader.SentimentIntensityAnalyzer.polarity_scores(user_response);
  console.log(intensity)
  var indexOfMaxValue = [intensity.neg, intensity.neu, intensity.pos].reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
  return indexOfMaxValue
}

var MongoClient = require('mongodb').MongoClient;
// let url = edited by April

function addDataInDB(convo, next) {
  MongoClient.connect(url, {useNewUrlParser: true,}, function(err, db) {
    if (err) {
      console.log(err)
      process.exit(0)
    }
    // var db2 = edited by April
    // let collection = edited by April
    var record = {
      "student_id": user_id,
      "time": current_time,
      "topic": convo.vars.topic,
      "course_content": convo.vars.course,
      "prof_name": convo.vars.prof_name,
      "instr_wk": convo.vars.week_instruction,
      "emoji_sentiment": convo.vars.emoji_rating,
      "topic_response": convo.vars.topic_response
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

module.exports = function(controller) {
  controller.hears(['^hi lysa$'], 'direct_message', function(bot, message) {
    bot.api.users.info({user: message.user}, function(err, info){
      user_id = info.user.id
      bot.createConversation(message, function(err, convo) {
        // Add some messages to our default thread
        convo.addMessage("Hi " + info.user.name + ", I'm Lysa, your friendly neighborhood feedback bot!", 'default')
        convo.ask({
          attachments:[
            {
              title: "What would you like to talk about today? You can also say 'done' now (or at any time) to quit.",
              callback_id: 'initialize_convo',
              color: '4eb3d3',
              attachment_type: 'default',
              actions: [
                {
                  "name":"asgmt",
                  "text": "Assignments",
                  "value": "asgmt",
                  "type": "button",
                },
                {
                  "name":"course",
                  "text": "Course content",
                  "value": "course",
                  "type": "button",
                },
                {
                  "name":"instr",
                  "text": "Instructor",
                  "value": "instr",
                  "type": "button",
                },
                {
                  "name":"misc",
                  "text": "Miscellaneous",
                  "value": "misc",
                  "type": "button",
                },
                {
                  "name":"no_chat",
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
            callback: function(reply, convo) {
              convo.setVar('topic', "assignment")
              convo.setVar('pt_person', "instructor")
              convo.setVar('pt_topic', "course")
              convo.next()
              convo.gotoThread("on_board_course");
            }
          },
          {
            pattern: "course",
            callback: function(reply, convo) {
              // convo.setVar('topic', "async")
              convo.next()
              convo.gotoThread("specific_course");
            }
          },
          {
            pattern: "live_sesh",
            callback: function(reply, convo) {
              convo.setVar('topic', "live session")
              convo.setVar('pt_person', "instructor")
              convo.setVar('pt_topic', "course")
              convo.next()
              convo.gotoThread("on_board_course");
            }
          },
          {
            pattern: "instr",
            callback: function(reply, convo) {
              convo.setVar('topic', "instructor")
              convo.setVar('pt_person', "instructor")
              convo.setVar('pt_topic', "course")
              convo.next()
              convo.gotoThread("on_board_course");
            }
          },
          {
            pattern: "misc",
            callback: function(reply, convo) {
              convo.setVar('topic', "miscellaneous")
              convo.next()
              convo.gotoThread("specific_misc");
            }
          },
          {
            pattern: "done",
            callback: function(reply, convo) {
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
          text: "Let's chat later, ping me anytime by typing 'hi lysa'",
          action: 'completed',
        }, "no_bye");

        convo.addQuestion({
          // text: '',
          attachments:[{
            "title": "OK, which session in particular are you interested in?",
            "color": "#4F3F8B",
            callback_id: 'topic_emoji_sentiment',
            actions: [
              {
                "name":"async",
                "text": "Async lectures",
                "value": "async",
                "type": "button",
              },
              {
                "name":"live_sesh",
                "text": "Live session",
                "value": "live_sesh",
                "type": "button",
              }
            ]
          }]
        },[{
          pattern: "async",
          callback: function(reply, convo) {
            convo.setVar('topic', "asynchronous session")
            convo.setVar('pt_person', "instructor")
            convo.setVar('pt_topic', "course")
            convo.next()
            convo.gotoThread("on_board_course");
          }
        },
        {
          pattern: "live_sesh",
          callback: function(reply, convo) {
            convo.setVar('topic', "live session")
            convo.setVar('pt_person', "instructor")
            convo.setVar('pt_topic', "course")
            convo.next()
            convo.gotoThread("on_board_course");
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
            callback_id: 'topic_emoji_sentiment',
            actions: [
              {
                "name":"admin",
                "text": "Admin",
                "value": "admin",
                "type": "button",
              },
              {
                "name":"o_h",
                "text": "Student support",
                "value": "o_h",
                "type": "button",
              },
              {
                "name":"tech",
                "text": "Technology",
                "value": "tech",
                "type": "button",
              },
              {
                "name":"other",
                "text": "Other",
                "value": "other",
                "type": "button",
              }
            ]
          }]
        },[{
          pattern: "admin",
          callback: function(reply, convo) {
            convo.setVar('topic', "admin")
            convo.setVar('pt_person', "instructor or point of contact")
            convo.setVar('pt_topic', "course or specific topic")
            convo.next()
            convo.gotoThread("on_board_course");
          }
        },
        {
          pattern: "o_h",
          callback: function(reply, convo) {
            convo.setVar('topic', "student support")
            convo.setVar('pt_person', "instructor or point of contact")
            convo.setVar('pt_topic', "course or specific topic")
            convo.next()
            convo.gotoThread("on_board_course");
          }
        },
        {
          pattern: "tech",
          callback: function(reply, convo) {
            convo.setVar('topic', "technology")
            convo.setVar('pt_person', "instructor or point of contact")
            convo.setVar('pt_topic', "course or specific topic")
            convo.next()
            convo.gotoThread("on_board_course");
          }
        },
        {
          pattern: "other",
          callback: function(reply, convo) {
            convo.setVar('topic', "other")
            convo.setVar('pt_person', "instructor or point of contact")
            convo.setVar('pt_topic', "course or specific topic")
            convo.next()
            convo.gotoThread("on_board_course");
          }
        },
        {
          default: true,
          callback: function(reply, convo) {
            // do nothing
          }
        },], {}, 'specific_misc');

        convo.addQuestion('OK, let me get some information from you before getting started. What specific {{vars.pt_topic}} is this feedback on  "{{vars.topic}}" referring to? Please provide the course number, e.g. "201"', function(response, convo) {
          convo.setVar('course', response.text)
          convo.next()
          convo.gotoThread('on_board_prof')
        }, {key: 'CourseName'}, 'on_board_course');

        convo.addQuestion('Who is your {{vars.course}} {{vars.pt_person}}? Please provide their first and last name, e.g. "Jane Smith"', function(response, convo) {
          convo.setVar('prof_name', response.text)
          convo.next()
          convo.gotoThread('on_board_wk_instr')
        }, {key: 'ProfName'}, 'on_board_prof');

        convo.addQuestion('What is the current week of instruction? Please enter a number, e.g. "4" (If you are no longer enrolled in the course and providing feedback after the course has ended, please enter "alum")
', function(response, convo) {
          convo.setVar('week_instruction', response.text)
          convo.next()
          convo.gotoThread('topic_emoji_rate')
        }, {key: 'WeekInstruction'}, 'on_board_wk_instr');

        convo.addQuestion({
          text: 'Great, thank you for the information.',
          attachments:[{
            "title": "What is your overall experience with {{vars.topic}} in {{vars.course}}?",
            "color": "#4F3F8B",
            callback_id: 'topic_emoji_sentiment',
            actions: [
              {
                "name":"pos1",
                "text": ":grinning:",
                "value": "pos1",
                "type": "button",
              },
              {
                "name":"pos",
                "text": ":simple_smile:",
                "value": "pos",
                "type": "button",
              },
              {
                "name":"neu",
                "text": ":neutral_face:",
                "value": "neu",
                "type": "button",
              },
              {
                "name":"neg",
                "text": ":disappointed:",
                "value": "neg",
                "type": "button",
              },
              {
                "name":"neg1",
                "text": ":sob:",
                "value": "neg1",
                "type": "button",
              }
            ]
          }]
        },[{
          pattern: "pos1",
          callback: function(reply, convo) {
            convo.setVar('emoji_rating', "pos1");
            convo.setVar('emoji_response', "That is fantastic!")
            // convo.next();
            // convo.gotoThread("topic_text_response");
            if (convo.vars.topic == "instructor" ||
            convo.vars.topic == "admin" || convo.vars.topic == "other") {
              convo.gotoThread('topic_text_response_i');
            } else {
              convo.gotoThread('topic_text_response');
            }
          }
        },
        {
          pattern: "pos",
          callback: function(reply, convo) {
            convo.setVar('emoji_rating', "pos");
            convo.setVar('emoji_response', "Great!")
            // convo.next();
            // convo.gotoThread("topic_text_response");
            if (convo.vars.topic == "instructor" ||
            convo.vars.topic == "admin" || convo.vars.topic == "other") {
              convo.gotoThread('topic_text_response_i');
            } else {
              convo.gotoThread('topic_text_response');
            }
          }
        },
        {
          pattern: "neu",
          callback: function(reply, convo) {
            convo.setVar('emoji_rating', "neu");
            convo.setVar('emoji_response', "Okay.")
            // convo.next();
            // convo.gotoThread("topic_text_response");
            // do something awesome here.
            if (convo.vars.topic == "instructor" ||
            convo.vars.topic == "admin" || convo.vars.topic == "other") {
              convo.gotoThread('topic_text_response_i');
            } else {
              convo.gotoThread('topic_text_response');
            }
          }
        },
        {
          pattern: "neg",
          callback: function(reply, convo) {
            convo.setVar('emoji_rating', "neg");
            convo.setVar('emoji_response', "I am sorry to hear that.")
            // convo.next();
            // convo.gotoThread("topic_text_response");
            if (convo.vars.topic == "instructor" ||
            convo.vars.topic == "admin" || convo.vars.topic == "other") {
              convo.gotoThread('topic_text_response_i');
            } else {
              convo.gotoThread('topic_text_response');
            }
          }
        },
        {
          pattern: "neg1",
          callback: function(reply, convo) {
            convo.setVar('emoji_rating', "neg1");
            convo.setVar('emoji_response', "That is unfortunate, I am sorry to hear that.")
            // convo.next();
            // convo.gotoThread("topic_text_response");
            if (convo.vars.topic == "instructor" ||
            convo.vars.topic == "admin" || convo.vars.topic == "other") {
              convo.gotoThread('topic_text_response_i');
            } else {
              convo.gotoThread('topic_text_response');
            }
          }
        },
        {
          default: true,
          callback: function(reply, convo) {
            convo.say("Didn't quite catch that, sorry!");
            convo.repeat();
          }
        },], {key: 'EmojiSentiment'}, 'topic_emoji_rate');

        convo.addQuestion('{{vars.emoji_response}} what is working well related to "{{vars.topic}}"? E.g. "The instructions for each assignment have been very clear, which has helped keep me on the right track as I worked through each one." Please make sure to send one long text message rather than several short messages, thank you!', function(response, convo) {
          convo.setVar('topic_response', response.text)
          convo.gotoThread('topic_text_response_i1');
        }, {key: 'TopicResponse'}, 'topic_text_response_i');

        convo.addQuestion('What would you change related to "{{vars.topic}}" to improve {{vars.course}}? E.g. "It would be great to get feedback on assignments sooner, so I could learn from my mistakes and apply that to future assignments before they’re due."', function(response, convo) {
          // convo.setVar('topic_response', response.text)
          convo.gotoThread('topic_text_response_i2');
        }, {key: 'TopicResponse'}, 'topic_text_response_i1');

        convo.addQuestion("What is your overall experience with {{vars.topic}} for {{vars.course}}?", function(response, convo) {
          convo.setVar('topic_response', response.text)
          var sentiment_index = identifySentiment(response.text);
          if (sentiment_index == 0) {
            convo.gotoThread('neg_additional_topic');
          } else if (sentiment_index == 1) {
            convo.gotoThread('neu_additional_topic');
          } else {
            convo.gotoThread('pos_additional_topic');
          }
        }, {key: 'TopicResponse'}, 'topic_text_response_i2');

        convo.addQuestion("{{vars.emoji_response}} Tell me what's working well with {{vars.topic}}, that should continue in the same way. Please make sure to send one long text message rather than several short messages, thank you!", function(response, convo) {
          convo.setVar('topic_response', response.text)
          convo.gotoThread('topic_text_response_1');
          // var sentiment_index = identifySentiment(response.text);
          // if (sentiment_index == 0) {
          //   convo.gotoThread('neg_additional_topic');
          // } else if (sentiment_index == 1) {
          //   convo.gotoThread('neu_additional_topic');
          // } else {
          //   convo.gotoThread('pos_additional_topic');
          // }
        }, {key: 'TopicResponse'}, 'topic_text_response');

        convo.addQuestion("What should change with {{vars.topic}}, that would improve the {{vars.course}}.", function(response, convo) {
          // convo.setVar('topic_response', response.text)
          convo.gotoThread('topic_text_response_i2');
        }, {key: 'TopicResponse'}, 'topic_text_response_1');

        convo.addMessage({
          text: "Sorry to hear about that. I'll pass the feedback along.",
          action: 'additional_loop',
        }, "neg_additional_topic");

        convo.addMessage({
          text: "OK, thank you for that. I'll pass that feedback along.",
          action: 'additional_loop',
        }, "neu_additional_topic");

        convo.addMessage({
          text: "That is great! Really glad to hear. I'll pass the feedback along.",
          action: 'additional_loop',
        }, "pos_additional_topic");

        convo.addQuestion({
          text: "",
          attachments:[{
            "title": "Is there anything else you'd like to talk about today?",
            "color": "#4F3F8B",
            callback_id: 'addl_loop',
            actions: [
              {
                "name": "yes",
                "text": ":thumbsup:",
                "value": "yes",
                "type": "button",
              },
              {
                "name": "no",
                "text": ":thumbsdown:",
                "value": "no",
                "type": "button",
              }
            ]
          }]
        }, [
          {
            pattern: "yes",
            callback: function(reply, convo) {
              convo.next()
              convo.gotoThread("check_same_topic");
            }
          },
          {
            pattern: "no",
            callback: function(reply, convo) {
              convo.next()
              convo.gotoThread("end_chat");
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
                "name": "yes",
                "text": ":thumbsup:",
                "value": "yes",
                "type": "button",
              },
              {
                "name": "no",
                "text": ":thumbsdown:",
                "value": "no",
                "type": "button",
              }
            ]
          }]
        }, [
          {
            pattern: "yes",
            callback: function(reply, convo) {
              convo.next()
              convo.gotoThread("additional_topic");
            }
          },
          {
            pattern: "no",
            callback: function(reply, convo) {
              convo.next()
              convo.gotoThread("end_chat");
            }
          }
        ], {key: 'CheckSameTopic'}, 'check_same_topic')

        convo.addQuestion({
          text: 'OK.',
          attachments:[{
            "title": "Please choose a topic you'd like to talk about. Additionally, you can type 'no' to end our conversation.",
            "color": "#4F3F8B",
            callback_id: 'additional_convo',
            actions: [
              {
                "name":"asgmt",
                "text": "Assignments",
                "value": "asgmt",
                "type": "button",
              },
              {
                "name":"course",
                "text": "Course",
                "value": "course",
                "type": "button",
              },
              {
                "name":"instr",
                "text": "Instructor",
                "value": "instr",
                "type": "button",
              },
              // {
              //   "name":"office_hrs",
              //   "text": "Office hours",
              //   "value": "office_hrs",
              //   "type": "button",
              // },
              {
                "name":"misc",
                "text": "Miscellaneous",
                "value": "misc",
                "type": "button",
              },
              {
                "name":"no_chat",
                "text": "Nothing, bye!",
                "value": "done",
                "type": "button",
              }
            ]
          }]
        },[
          {
            pattern: "asgmt",
            callback: function(reply, convo) {
              convo.setVar('topic', "assignment")
              convo.next()
              convo.gotoThread("topic_emoji_rate");
            }
          },
          {
            pattern: "course",
            callback: function(reply, convo) {
              // convo.setVar('topic', "async")
              convo.next()
              convo.gotoThread("specific_course1");
            }
          },
          {
            pattern: "live_sesh",
            callback: function(reply, convo) {
              convo.setVar('topic', "live session")
              convo.next()
              convo.gotoThread("topic_emoji_rate");
            }
          },
          {
            pattern: "instr",
            callback: function(reply, convo) {
              convo.setVar('topic', "instructor")
              convo.next()
              convo.gotoThread("topic_emoji_rate");
            }
          },
          // {
          //   pattern: "office_hrs",
          //   callback: function(reply, convo) {
          //     convo.setVar('topic', "office hours")
          //     convo.next()
          //     convo.gotoThread("topic_emoji_rate");
          //   }
          // },
          {
            pattern: "misc",
            callback: function(reply, convo) {
              convo.setVar('topic', "miscellaneous")
              convo.next()
              convo.gotoThread("specific_misc1");
            }
          },
          {
            pattern: "no",
            callback: function(reply, convo) {
              convo.gotoThread("end_chat");
            }
          },
          {
            default: true,
            callback: function(reply, convo) {
              convo.say("Didn't quite catch that, sorry!");
              convo.repeat();
              // do nothing
            }
          },], {key: 'AdditionalTopic'}, 'additional_topic')

          convo.addQuestion({
            // text: '',
            attachments:[{
              "title": "OK, which session in particular are you interested in?",
              "color": "#4F3F8B",
              callback_id: 'topic_emoji_sentiment',
              actions: [
                {
                  "name":"async",
                  "text": "Asynch lectures",
                  "value": "async",
                  "type": "button",
                },
                {
                  "name":"live_sesh",
                  "text": "Live session",
                  "value": "live_sesh",
                  "type": "button",
                }
              ]
            }]
          },[{
            pattern: "async",
            callback: function(reply, convo) {
              convo.setVar('topic', "asynchronous lecture")
              convo.next()
              convo.gotoThread("topic_emoji_rate");
            }
          },
          {
            pattern: "live_sesh",
            callback: function(reply, convo) {
              convo.setVar('topic', "live session")
              convo.next()
              convo.gotoThread("topic_emoji_rate");
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
              callback_id: 'topic_emoji_sentiment',
              actions: [
                {
                  "name":"admin",
                  "text": "Admin",
                  "value": "admin",
                  "type": "button",
                },
                {
                  "name":"o_h",
                  "text": "Student support",
                  "value": "o_h",
                  "type": "button",
                },
                {
                  "name":"tech",
                  "text": "Technology",
                  "value": "tech",
                  "type": "button",
                },
                {
                  "name":"other",
                  "text": "Other",
                  "value": "other",
                  "type": "button",
                }
              ]
            }]
          },[{
            pattern: "admin",
            callback: function(reply, convo) {
              convo.setVar('topic', "admin")
              // convo.setVar('pt_person', "instructor or point of contact")
              // convo.setVar('pt_topic', "course or specific topic")
              convo.next()
              convo.gotoThread("topic_emoji_rate");
            }
          },
          {
            pattern: "o_h",
            callback: function(reply, convo) {
              convo.setVar('topic', "student support")
              // convo.setVar('pt_person', "instructor or point of contact")
              // convo.setVar('pt_topic', "course or specific topic")
              convo.next()
              convo.gotoThread("topic_emoji_rate");
            }
          },
          {
            pattern: "tech",
            callback: function(reply, convo) {
              convo.setVar('topic', "technology")
              // convo.setVar('pt_person', "instructor or point of contact")
              // convo.setVar('pt_topic', "course or specific topic")
              convo.next()
              convo.gotoThread("topic_emoji_rate");
            }
          },
          {
            pattern: "other",
            callback: function(reply, convo) {
              convo.setVar('topic', "other")
              // convo.setVar('pt_person', "instructor or point of contact")
              // convo.setVar('pt_topic', "course or specific topic")
              convo.next()
              convo.gotoThread("topic_emoji_rate");
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


          })
        });
      });
    }
