const vader = require('vader-sentiment');

function identifySentiment(user_response) {
  var intensity = vader.SentimentIntensityAnalyzer.polarity_scores(user_response);
  console.log(intensity)
  var indexOfMaxValue = [intensity.neg, intensity.neu, intensity.pos].reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
  return indexOfMaxValue
}

module.exports = function(controller) {
  
  controller.hears(['^hi tess$'], 'direct_message', function(bot, message) {
    bot.startConversation(message, function(err, convo) {
      // Add some messages to our default thread 
      convo.addMessage('Hi I am TESS!', 'default')
      convo.addMessage('I\'m an anonymous Slack bot created by MIDS students to better understand how classes are going for current students.', 'default')
      convo.addMessage('I have limited capabilities, such as discussing how class is going for you.', 'default')
      
      convo.addQuestion('Do you want to chat? Say YES, NO or DONE to quit. You can also say SKIP to leave me a message', [
        // add function where students can skip and write out a paragraph without directed questions
        {
          pattern: 'done',
          callback: function(response,convo) {
            convo.gotoThread("doneChat");
          }
        },
        {
          pattern: bot.utterances.no,
          callback: function(response,convo) {
            convo.gotoThread("noChat");
          }
        },
        {
          pattern: 'skip',
          callback: function(response,convo) {
            convo.gotoThread("step0_free_text");
          }
        },
        {
          default: true,
          callback: function(response,convo) {
            // just repeat the question
            convo.say('Didn\'t quite catch that, sorry!');
            convo.repeat();
            convo.next();
          }
        },
        {
          pattern: bot.utterances.yes,
          callback: function(response,convo) {
            convo.gotoThread("step1_course");
          }
        }
      ], {}, 'default');
      
      convo.addMessage({
        text: 'OK, you\'re all set, good bye!',
        action: 'completed',
      }, "doneChat");
      convo.addMessage({
        text: 'Let\'s chat later, ping me anytime by typing \"hi tess\"',
        action: 'completed',
      }, "noChat");
      
      // Add a question, to the deafult thread, with a response handler that will set a variable
      // and then switch us to another thread
      convo.addQuestion('OK, let me get some information from you before getting started. What class would you like to discuss? You can give me the course number or the title.', function(response, convo) {
        convo.setVar('course_num_name', response.text)
        convo.next()
        // now the convo.vars field has been updated
        // console.log('convo.vars:', convo.vars)
        convo.gotoThread('step2_prof')
      }, {key: 'CourseNumName'}, 'step1_course');
      
      // Since this variable is defined after our response handler runs,
      // it is available throughout our conversation after that point
      // convo.addMessage('Ok, here is a variable again: {{vars.course_num_name}}', 'step2')
      convo.addQuestion('What is your {{vars.course_num_name}} instructor\'s name?', function(response, convo) {
        convo.setVar('prof_name', response.text)
        convo.next()
        convo.gotoThread('step3_week_instr')
      }, {key: 'ProfName'}, 'step2_prof');
      
      convo.addQuestion('What is the current week of instruction?', function(response, convo) {
        convo.setVar('week_instruction', response.text)
        convo.next()
        convo.addMessage('Thank you for the info.')
        convo.gotoThread('step4_class_feel')
      }, {key: 'WeekInstruction'}, 'step3_week_instr');
      
      convo.addQuestion('I\'d love to hear your thoughts {{vars.course_num_name}}. Before diving in deep to discuss the course content, instructor effectiveness and the assignments/projects -- generally how is it going? Please give me your response in one message rather than multiple short messages.', function(response, convo) {
        convo.setVar('class_feel', response.text)
        var sentiment_index = identifySentiment(response.text)
        // 0 = neg, 1 = neu, 2 = pos
        if (sentiment_index == 0) {
          // switch to negative thread thread immediately
          convo.gotoThread('step5_neg_thread_course_content');
        } else if (sentiment_index == 1) {
          convo.gotoThread('step5_neu_thread_course_content');
        } else {
          convo.gotoThread('step5_pos_thread_course_content');
        }
      }, {key: 'ClassFeel'}, 'step4_class_feel');
      //step4_class_feel
      
      convo.addQuestion('I\'m sorry to hear that. Let\'s move on to discussing the course content. Is the content helpful? What specific units need changes? What can be clarified in the async lectures? Are the short quizzes actually useful? You can also say "skip" if you\'d like to move on!' ,[
        {
          pattern: 'skip',
          callback: function(response,convo) {
            convo.gotoThread("step6_neu_instructor_effectiveness");
          }
        },
        {
          default: true,
          callback: function(response,convo) {
            convo.setVar('course_content', response.text)
            var sentiment_index = identifySentiment(response.text)
            if (sentiment_index == 0) {
              convo.gotoThread('step6_neg_instructor_effectiveness');
            } else if (sentiment_index == 1) {
              convo.gotoThread('step6_neu_instructor_effectiveness');
            } else {
              convo.gotoThread('step6_pos_instructor_effectiveness');
            }
          }
        }
      ], {key: 'CourseContent'}, "step5_neg_thread_course_content");
      
      convo.addQuestion('Gotcha. Let\'s move on to discussing the course content. Is the content helpful? What specific units need changes? What can be clarified in the async lectures? Are the short quizzes actually useful? You can also say "skip" if you\'d like to move on!', [
        {
          pattern: 'skip',
          callback: function(response,convo) {
            convo.gotoThread("step6_neu_instructor_effectiveness");
          }
        },
        {
          default: true,
          callback: function(response,convo) {
            convo.setVar('course_content', response.text)
            var sentiment_index = identifySentiment(response.text);
            if (sentiment_index == 0) {
              convo.gotoThread('step6_neg_instructor_effectiveness');
            } else if (sentiment_index == 1) {
              convo.gotoThread('step6_neu_instructor_effectiveness');
            } else {
              convo.gotoThread('step6_pos_instructor_effectiveness');
            }
          }
        }
      ], {key: 'CourseContent'}, "step5_neu_thread_course_content");
      
      convo.addQuestion('That\'s great to hear! Let\'s move on to discussing the course content. Is the content helpful? What specific units need changes? What can be clarified in the async lectures? Are the short quizzes actually useful? You can also say "skip" if you\'d like to move on!', [
        {
          pattern: 'skip',
          callback: function(response,convo) {
            convo.gotoThread("step6_neu_instructor_effectiveness");
          }
        },
        {
          default: true,
          callback: function(response,convo) {
            convo.setVar('course_content', response.text)
            var sentiment_index = identifySentiment(response.text);
            if (sentiment_index == 0) {
              convo.gotoThread('step6_neg_instructor_effectiveness');
            } else if (sentiment_index == 1) {
              convo.gotoThread('step6_neu_instructor_effectiveness');
            } else {
              convo.gotoThread('step6_pos_instructor_effectiveness');
            }
          }
        }
      ], {key: 'CourseContent'}, "step5_pos_thread_course_content");
      
      convo.addQuestion('I\'m sorry to hear that. How about your instructor for {{vars.course_num_name}}. What specifically about the instructor could be improved? Are they struggling in working across a video platform? For class cancellations, can the instructor coordinate make-up classes ahead of time? Again, you can skip this question by typing "skip" !' ,[
        {
          pattern: 'skip',
          callback: function(response,convo) {
            convo.gotoThread("step7_neu_technology");
          }
        },
        {
          default: true,
          callback: function(response,convo) {
            convo.setVar('instructor_effectiveness', response.text)
            var sentiment_index = identifySentiment(response.text);
            if (sentiment_index == 0) {
              convo.gotoThread('step7_neg_technology');
            } else if (sentiment_index == 1) {
              convo.gotoThread('step7_neu_technology');
            } else {
              convo.gotoThread('step7_pos_technology');
            }
          }
        }
      ], {key: 'InstructorEffectiveness'}, "step6_neg_instructor_effectiveness");
      
      convo.addQuestion('Got it. How about your instructor for {{vars.course_num_name}}. What specifically about the instructor could be improved? Are they struggling in working across a video platform? For class cancellations, can the instructor coordinate make-up classes ahead of time? Again, you can skip this question by typing "skip" !' ,[
        {
          pattern: 'skip',
          callback: function(response,convo) {
            convo.gotoThread("step7_neu_technology");
          }
        },
        {
          default: true,
          callback: function(response,convo) {
            convo.setVar('instructor_effectiveness', response.text)
            var sentiment_index = identifySentiment(response.text);
            if (sentiment_index == 0) {
              convo.gotoThread('step7_neg_technology');
            } else if (sentiment_index == 1) {
              convo.gotoThread('step7_neu_technology');
            } else {
              convo.gotoThread('step7_pos_technology');
            }
          }
        }
      ], {key: 'InstructorEffectiveness'}, "step6_neu_instructor_effectiveness");
      
      convo.addQuestion('Fantastic! How about your instructor for {{vars.course_num_name}}. What specifically about the instructor could be improved? Are they struggling in working across a video platform? For class cancellations, can the instructor coordinate make-up classes ahead of time? Again, you can skip this question by typing "skip" !' ,[
        {
          pattern: 'skip',
          callback: function(response,convo) {
            convo.gotoThread("step7_neu_technology");
          }
        },
        {
          default: true,
          callback: function(response,convo) {
            convo.setVar('instructor_effectiveness', response.text)
            var sentiment_index = identifySentiment(response.text);
            if (sentiment_index == 0) {
              convo.gotoThread('step7_neg_technology');
            } else if (sentiment_index == 1) {
              convo.gotoThread('step7_neu_technology');
            } else {
              convo.gotoThread('step7_pos_technology');
            }
          }
        }
      ], {key: 'InstructorEffectiveness'}, "step6_pos_instructor_effectiveness");
      
      convo.addQuestion('Oh no! That\'s not ideal! Let\'s talk about the technology for async and sync sessions. Do you find it useful? Are there any video content that needs improvement? Type "skip" to bypass.' ,[
        {
          pattern: 'skip',
          callback: function(response,convo) {
            convo.gotoThread("step8_neu_hw_projects");
          }
        },
        {
          default: true,
          callback: function(response,convo) {
            convo.setVar('technology_video', response.text)
            var sentiment_index = identifySentiment(response.text);
            if (sentiment_index == 0) {
              convo.gotoThread('step8_neg_hw_projects');
            } else if (sentiment_index == 1) {
              convo.gotoThread('step8_neu_hw_projects');
            } else {
              convo.gotoThread('step8_pos_hw_projects');
            }
          }
        }
      ], {key: 'TechnologyVideo'}, "step7_neg_technology");
      
      convo.addQuestion('Alright. Let\'s talk about the technology for async and sync sessions. Do you find it useful? Are there any video content that needs improvement? Type "skip" to bypass.' ,[
        {
          pattern: 'skip',
          callback: function(response,convo) {
            convo.gotoThread("step8_neu_hw_projects");
          }
        },
        {
          default: true,
          callback: function(response,convo) {
            convo.setVar('technology_video', response.text)
            var sentiment_index = identifySentiment(response.text);
            if (sentiment_index == 0) {
              convo.gotoThread('step8_neg_hw_projects');
            } else if (sentiment_index == 1) {
              convo.gotoThread('step8_neu_hw_projects');
            } else {
              convo.gotoThread('step8_pos_hw_projects');
            }
          }
        }
      ], {key: 'TechnologyVideo'}, "step7_neu_technology");
      
      convo.addQuestion('Great, really glad to hear! Let\'s talk about the technology for async and sync sessions. Do you find it useful? Are there any video content that needs improvement? Type "skip" to bypass.' ,[
        {
          pattern: 'skip',
          callback: function(response,convo) {
            convo.gotoThread("step8_neu_hw_projects");
          }
        },
        {
          default: true,
          callback: function(response,convo) {
            convo.setVar('technology_video', response.text)
            var sentiment_index = identifySentiment(response.text);
            if (sentiment_index == 0) {
              convo.gotoThread('step8_neg_hw_projects');
            } else if (sentiment_index == 1) {
              convo.gotoThread('step8_neu_hw_projects');
            } else {
              convo.gotoThread('step8_pos_hw_projects');
            }
          }
        }
      ], {key: 'TechnologyVideo'}, "step7_pos_technology");
      
      convo.addQuestion('I\'m sorry to hear that. Last but not least, how about homework assignments and projects? How is that going for you? Try "skip" to bypass.' ,[
        {
          pattern: 'skip',
          callback: function(response,convo) {
            convo.gotoThread("step9_neu_last_feedback");
          }
        },
        {
          default: true,
          callback: function(response,convo) {
            convo.setVar('hw_projects', response.text)
            var sentiment_index = identifySentiment(response.text);
            if (sentiment_index == 0) {
              convo.gotoThread('step9_neg_last_feedback');
            } else if (sentiment_index == 1) {
              // convo.say('Got it, thanks for your feed back on homework and projects.')
              convo.gotoThread('step9_neu_last_feedback');
            } else {
              convo.gotoThread('step9_pos_last_feedback');
            }
          }
        }
      ], {key: 'HWProjects'}, "step8_neg_hw_projects");
      
      convo.addQuestion('Okay. Last but not least, how about homework assignments and projects? How is that going for you? Try "skip" to bypass.' ,[
        {
          pattern: 'skip',
          callback: function(response,convo) {
            convo.gotoThread("step9_neu_last_feedback");
          }
        },
        {
          default: true,
          callback: function(response,convo) {
            convo.setVar('hw_projects', response.text)
            var sentiment_index = identifySentiment(response.text);
            if (sentiment_index == 0) {
              convo.gotoThread('step9_neg_last_feedback');
            } else if (sentiment_index == 1) {
              // convo.say('Got it, thanks for your feed back on homework and projects.')
              convo.gotoThread('step9_neu_last_feedback');
            } else {
              convo.gotoThread('step9_pos_last_feedback');
            }
          }
        }
      ], {key: 'HWProjects'}, "step8_neu_hw_projects");
      
      convo.addQuestion('Great great! Last but not least, how about homework assignments and projects? How is that going for you? Try "skip" to bypass.' ,[
        {
          pattern: 'skip',
          callback: function(response,convo) {
            convo.gotoThread("step9_neu_last_feedback");
          }
        },
        {
          default: true,
          callback: function(response,convo) {
            convo.setVar('hw_projects', response.text)
            var sentiment_index = identifySentiment(response.text);
            if (sentiment_index == 0) {
              convo.gotoThread('step9_neg_last_feedback');
            } else if (sentiment_index == 1) {
              // convo.say('Got it, thanks for your feed back on homework and projects.')
              convo.gotoThread('step9_neu_last_feedback');
            } else {
              convo.gotoThread('step9_pos_last_feedback');
            }
          }
        }
      ], {key: 'HWProjects'}, "step8_pos_hw_projects");
      
      convo.addQuestion('Sorry to hear that -- it\'s often difficult for students because the only feedback given are in text. Thank you for your input. Is there anything else you would like to add?' ,[
        {
          pattern: 'skip',
          callback: function(response,convo) {
            convo.gotoThread("step10_complete");
          }
        },
        {
          pattern: bot.utterances.no,
          callback: function(response,convo) {
            convo.gotoThread("step10_complete");
          }
        },
        {
          default: true,
          callback: function(response,convo) {
            convo.setVar('last_feedback', response.text)
            var sentiment_index = identifySentiment(response.text);
            if (sentiment_index == 0) {
              convo.gotoThread('step10_neg_last_feedback');
            } else if (sentiment_index == 1) {
              convo.gotoThread('step10_neu_last_feedback');
            } else {
              convo.gotoThread('step10_pos_last_feedback');
            }
          }
        }
      ], {key: 'LastFeedback'}, "step9_neg_last_feedback");
      
      convo.addQuestion('Thanks for your feedback. Is there anything else you would like to add?' ,[
        {
          pattern: 'skip',
          callback: function(response,convo) {
            convo.gotoThread("step10_complete");
          }
        },
        {
          pattern: bot.utterances.no,
          callback: function(response,convo) {
            convo.gotoThread("step10_complete");
          }
        },
        {
          default: true,
          callback: function(response,convo) {
            convo.setVar('last_feedback', response.text)
            var sentiment_index = identifySentiment(response.text);
            if (sentiment_index == 0) {
              convo.gotoThread('step10_neg_last_feedback');
            } else if (sentiment_index == 1) {
              convo.gotoThread('step10_neu_last_feedback');
            } else {
              convo.gotoThread('step10_pos_last_feedback');
            }
          }
        }
      ], {key: 'LastFeedback'}, "step9_neu_last_feedback");
      
      convo.addQuestion('Awesome. Thank you for your input. Is there anything else you would like to add?' ,[
        {
          pattern: 'skip',
          callback: function(response,convo) {
            convo.gotoThread("step10_complete");
          }
        },
        {
          pattern: bot.utterances.no,
          callback: function(response,convo) {
            convo.gotoThread("step10_complete");
          }
        },
        {
          default: true,
          callback: function(response,convo) {
            convo.setVar('last_feedback', response.text)
            var sentiment_index = identifySentiment(response.text);
            if (sentiment_index == 0) {
              convo.gotoThread('step10_neg_last_feedback');
            } else if (sentiment_index == 1) {
              convo.gotoThread('step10_neu_last_feedback');
            } else {
              convo.gotoThread('step10_pos_last_feedback');
            }
          }
        }
      ], {key: 'LastFeedback'}, "step9_pos_last_feedback");
      
      convo.addQuestion('Sure, no problem! Please tell me which course and what professor you\'re giving your feedback on. I will find it very helpful if you can leave me constructive feedback on areas such as course content, instructor effectiveness, technology, homework and projects. ' ,
      function(response,convo) {
        convo.setVar('no_q_feedback', response.text)
        convo.gotoThread("step9_neu_last_feedback");
      }
      , {key: 'NoQFeedback'}, "step0_free_text");
      
      convo.addMessage({
        text: 'I\'m sorry to hear that overall things are not so positive. Thank you for your criticial feedback! Hope you have a great rest of your day!',
        action: 'completed',
      }, 'step10_neg_last_feedback');
      
      convo.addMessage({
        text: 'Got it. Thank you for your criticial feedback! Hope you have a great rest of your day!',
        action: 'completed',
      }, 'step10_neu_last_feedback');
      
      convo.addMessage({
        text: 'That\'s great to hear! Thank you for your criticial feedback! Hope you have a great rest of your day!',
        action: 'completed',
      }, 'step10_pos_last_feedback')
      
      convo.addMessage({
        text: 'Awesome. Thank you for sharing your feedback with me today. Have a great rest of your day!',
        action: 'completed',
      }, "step10_complete");
      
    })
  });
}
