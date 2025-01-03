const { google } = require('googleapis');
const forms = google.forms('v1');

// Configure OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Set refresh token
if (!process.env.GOOGLE_REFRESH_TOKEN) {
  console.error('Warning: GOOGLE_REFRESH_TOKEN is not set in environment variables');
}

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

// Create a new feedback form
async function createFeedbackForm(title) {
  try {
    if (!process.env.GOOGLE_REFRESH_TOKEN) {
      throw new Error('Google refresh token not configured');
    }

    const form = await forms.forms.create({
      auth: oauth2Client,
      requestBody: {
        info: {
          title: title,
          documentTitle: title
        }
    }});

    // Add form questions
    await forms.forms.batchUpdate({
      auth: oauth2Client,
      formId: form.data.formId,
      requestBody: {
        requests: [
          {
            createItem: {
              item: {
                title: 'Student ID',
                questionItem: {
                  question: {
                    required: true,
                    textQuestion: {
                      paragraph: false
                    }
                  }
                }
              },
              location: { index: 0 }
            }
          },
          {
            createItem: {
              item: {
                title: 'Event Title',
                questionItem: {
                  question: {
                    required: true,
                    textQuestion: {
                      paragraph: false
                    }
                  }
                }
              },
              location: { index: 1 }
            }
          },
          {
            createItem: {
              item: {
                title: 'Feedback Message',
                questionItem: {
                  question: {
                    required: true,
                    textQuestion: {
                      paragraph: true
                    }
                  }
                }
              },
              location: { index: 2 }
            }
          },
          {
            createItem: {
              item: {
                title: 'Rating',
                questionItem: {
                  question: {
                    required: true,
                    choiceQuestion: {
                      type: 'RADIO',
                      options: [
                        { value: '⭐⭐⭐⭐⭐ Excellent' },
                        { value: '⭐⭐⭐⭐ Very Good' },
                        { value: '⭐⭐⭐ Good' },
                        { value: '⭐⭐ Fair' },
                        { value: '⭐ Poor' }
                      ]
                    }
                  }
                }
              },
              location: { index: 3 }
            }
          }
        ]
      }
    });

    return form.data.formId;
  } catch (error) {
    console.error('Error creating form:', error);
    if (error.message.includes('invalid_grant')) {
      throw new Error('Google authentication failed. Please check refresh token.');
    }
    throw error;
  }
}

// Submit feedback to a form
async function submitFeedback(formId, feedback) {
  try {
    if (!process.env.GOOGLE_REFRESH_TOKEN) {
      throw new Error('Google refresh token not configured');
    }

    await forms.forms.responses.submit({
      auth: oauth2Client,
      formId: formId,
      requestBody: {
        responses: [
          {
            textAnswers: {
              answers: [{ value: feedback.studentId }]
            }
          },
          {
            textAnswers: {
              answers: [{ value: feedback.eventTitle }]
            }
          },
          {
            textAnswers: {
              answers: [{ value: feedback.message }]
            }
          },
          {
            textAnswers: {
              answers: [{ value: feedback.rating }]
            }
          }
        ]
      }
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    if (error.message.includes('invalid_grant')) {
      throw new Error('Google authentication failed. Please check refresh token.');
    }
    throw error;
  }
}

module.exports = {
  createFeedbackForm,
  submitFeedback
}; 