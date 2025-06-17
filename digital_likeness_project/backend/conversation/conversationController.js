const Conversation = require('../models/Conversation');
const IngestedData = require('../models/IngestedData'); // To access user's uploaded data

// Basic Stop Word List
const STOP_WORDS = [
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves',
  'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their',
  'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a',
  'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with',
  'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to',
  'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
  'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some',
  'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will',
  'just', 'don', 'should', 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', 'couldn', 'didn',
  'doesn', 'hadn', 'hasn', 'haven', 'isn', 'ma', 'mightn', 'mustn', 'needn', 'shan', 'shouldn', 'wasn', 'weren',
  'won', 'wouldn', 'tell', 'me', 'ask', 'please', 'give', 'explain'
];

// Simple Sentence Tokenizer
function tokenizeSentences(textBlock) {
  if (!textBlock || typeof textBlock !== 'string') {
    return [];
  }
  // Split by common sentence terminators. Handles cases like "Mr. Smith." to some extent by not splitting on every period.
  // More robust tokenization would require advanced NLP libraries.
  // This regex splits by '.', '!', '?' followed by a space or end of string, trying to avoid splitting mid-abbreviation.
  return textBlock.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|!)\s+/).filter(s => s.trim().length > 0);
}


// Submit a new message from the user and get a bot response
exports.submitMessage = (req, res, next) => {
  try {
    const { text: userMessageText } = req.body;
    const userId = req.user.id;

    if (!userMessageText || userMessageText.trim() === '') {
      return res.status(400).json({ message: 'Message text cannot be empty.' });
    }

    // 1. Record user's message
    const userMessage = Conversation.addMessage({
      userId,
      sender: 'user',
      text: userMessageText.trim(),
    });

    // 2. AI Logic: Keyword-based Retrieval
    let botResponseText = "I'm not sure how to respond to that. Can you try asking differently?"; // Default fallback

    const ingestedContents = IngestedData.findByUserId(userId);

    if (!ingestedContents || ingestedContents.length === 0) {
      botResponseText = "I don't have any information to draw from yet. Please upload some text data first so I can learn more about you.";
    } else {
      // Basic Keyword Extraction
      const userKeywords = userMessageText.toLowerCase().split(/\s+/)
        .filter(word => word.length > 2 && !STOP_WORDS.includes(word.replace(/[^\w\s]/gi, ''))); // Remove punctuation for stop word check

      if (userKeywords.length === 0) {
        botResponseText = "That's an interesting thought. Could you elaborate a bit more, or ask about something specific from your documents?";
      } else {
        const matchingSentences = [];
        ingestedContents.forEach(dataItem => {
          if (dataItem.content && typeof dataItem.content === 'string') {
            const sentences = tokenizeSentences(dataItem.content);
            sentences.forEach(sentence => {
              const sentenceLower = sentence.toLowerCase();
              for (const keyword of userKeywords) {
                if (sentenceLower.includes(keyword)) {
                  matchingSentences.push(sentence);
                  break; // Found a keyword in this sentence, move to next sentence
                }
              }
            });
          }
        });

        if (matchingSentences.length > 0) {
          // Randomly pick one of the matching sentences
          botResponseText = matchingSentences[Math.floor(Math.random() * matchingSentences.length)];
        } else {
          botResponseText = "I couldn't find anything specific to that in your documents. Try asking about something else or rephrasing.";
        }
      }
    }

    // 3. Record and Return Bot's Response
    const botMessage = Conversation.addMessage({
      userId,
      sender: 'bot',
      text: botResponseText,
    });

    res.status(201).json(botMessage);

  } catch (error) {
    console.error('Error in submitMessage:', error);
    next(error);
  }
};

// Get conversation history for the logged-in user
exports.getConversationHistory = (req, res, next) => {
  try {
    const userId = req.user.id;
    const history = Conversation.getMessagesByUserId(userId);
    res.status(200).json(history);
  } catch (error) {
    console.error('Error in getConversationHistory:', error);
    next(error);
  }
};

// Optional: Delete conversation history for the logged-in user
exports.deleteConversationHistory = (req, res, next) => {
    try {
        const userId = req.user.id;
        const deleted = Conversation.deleteMessagesByUserId(userId);
        if (deleted) {
            res.status(200).json({ message: 'Conversation history deleted successfully.' });
        } else {
            res.status(404).json({ message: 'No conversation history found to delete.' });
        }
    } catch (error) {
        console.error('Error in deleteConversationHistory:', error);
        next(error);
    }
};
