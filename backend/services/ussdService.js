const User = require('../models/User');
const Policy = require('../models/Policy');
const mobileMoneyService = require('./mobileMoneyService');

class USSDService {
  constructor() {
    this.menuStates = {
      INITIAL: 0,
      REGISTER_NAME: 1,
      REGISTER_AGE: 2,
      REGISTER_LOCATION: 3,
      CLAIM_DESCRIPTION: 4
    };
    this.sessions = {};
    this.sessionTimeout = 300000; // 5 minutes in milliseconds
  }

  async handleUSSDRequest(sessionId, serviceCode, phoneNumber, text) {
    try {
      const sanitizedPhone = this.sanitizePhoneNumber(phoneNumber);
      const currentSession = this.getOrCreateSession(sessionId, sanitizedPhone);
      
      const currentState = this.determineState(text);
      const user = await User.findOne({ phone: sanitizedPhone });
      
      switch (currentState.state) {
        case this.menuStates.INITIAL:
          return this.showMainMenu(user?.language || 'en');
        
        case this.menuStates.REGISTER_NAME:
          return this.promptForName(user?.language || 'en');
          
        case this.menuStates.REGISTER_AGE:
          if (!this.validateName(currentState.inputs.name)) {
            return this.getErrorMessage('invalidName', user?.language || 'en');
          }
          return this.promptForAge(user?.language || 'en');
          
        case this.menuStates.REGISTER_LOCATION:
          if (!this.validateAge(currentState.inputs.age)) {
            return this.getErrorMessage('invalidAge', user?.language || 'en');
          }
          return await this.completeRegistration(
            sanitizedPhone,
            currentState.inputs.name,
            currentState.inputs.age,
            user?.language || 'en'
          );
          
        case this.menuStates.CLAIM_DESCRIPTION:
          if (!user) {
            return this.getErrorMessage('notRegistered', user?.language || 'en');
          }
          return await this.processClaim(
            user,
            currentState.inputs.description,
            user.language || 'en'
          );
          
        default:
          return this.showMainMenu(user?.language || 'en');
      }
    } catch (error) {
      console.error('USSD processing error:', error);
      return this.getErrorMessage('systemError', 'en');
    } finally {
      this.cleanupSessions();
    }
  }

  determineState(text) {
    const inputs = {};
    const parts = text ? text.split('*') : [];
    
    if (parts.length === 0) {
      return { state: this.menuStates.INITIAL, inputs };
    }
    
    // Handle registration flow (option 1)
    if (parts[0] === '1') {
      if (parts.length === 1) return { state: this.menuStates.REGISTER_NAME, inputs };
      if (parts.length === 2) {
        inputs.name = parts[1];
        return { state: this.menuStates.REGISTER_AGE, inputs };
      }
      if (parts.length === 3) {
        inputs.name = parts[1];
        inputs.age = parts[2];
        return { state: this.menuStates.REGISTER_LOCATION, inputs };
      }
    }
    
    // Handle claim flow (option 2)
    if (parts[0] === '2') {
      if (parts.length === 1) return { state: this.menuStates.CLAIM_DESCRIPTION, inputs };
      if (parts.length === 2) {
        inputs.description = parts[1];
        return { state: this.menuStates.CLAIM_DESCRIPTION, inputs };
      }
    }
    
    return { state: this.menuStates.INITIAL, inputs };
  }

  showMainMenu(language = 'en') {
    const translations = this.getTranslations(language);
    return `CON ${translations.welcome}\n1. ${translations.register}\n2. ${translations.makeClaim}`;
  }

  promptForName(language = 'en') {
    const translations = this.getTranslations(language);
    return `CON ${translations.enterName}`;
  }

  promptForAge(language = 'en') {
    const translations = this.getTranslations(language);
    return `CON ${translations.enterAge}`;
  }

  async completeRegistration(phone, name, age, language = 'en') {
    const translations = this.getTranslations(language);
    
    try {
      const user = new User({
        phone,
        name,
        age: parseInt(age),
        language,
        registeredAt: new Date()
      });
      
      await user.save();
      return `END ${translations.registrationSuccess}`;
    } catch (error) {
      console.error('Registration error:', error);
      return `END ${translations.registrationFailed}`;
    }
  }

  async processClaim(user, description, language = 'en') {
    const translations = this.getTranslations(language);
    
    try {
      const policy = await Policy.findOne({ user: user._id });
      if (!policy) {
        return `END ${translations.noPolicyFound}`;
      }
      
      // Process the claim with the description
      const claim = {
        description,
        date: new Date(),
        status: 'submitted'
      };
      
      policy.claims.push(claim);
      await policy.save();
      
      return `END ${translations.claimSubmitted}`;
    } catch (error) {
      console.error('Claim processing error:', error);
      return `END ${translations.claimFailed}`;
    }
  }

  getTranslations(language) {
    const translations = {
      en: {
        welcome: "Welcome to Chitetezo Pa Moyo",
        register: "Register for insurance",
        makeClaim: "Make a claim",
        enterName: "Please enter your full name",
        enterAge: "Please enter your age",
        registrationSuccess: "Registration successful! You are now insured.",
        registrationFailed: "Registration failed. Please try again later.",
        claimSubmitted: "Your claim has been submitted successfully.",
        claimFailed: "Failed to submit claim. Please try again later.",
        noPolicyFound: "No active policy found. Please register first.",
        invalidName: "Invalid name. Please use letters only (2-50 characters).",
        invalidAge: "Invalid age. Please enter a number between 18 and 120.",
        notRegistered: "You need to register first. Please select option 1.",
        systemError: "System error. Please try again later."
      },
      ny: {
        welcome: "Takulandilani ku Chitetezo Pa Moyo",
        register: "Lembetsani kuti mupeze inshuwaransi",
        makeClaim: "Perekani cholinga",
        enterName: "Chonde lembani dzina lanu lonse",
        enterAge: "Chonde lembani zaka zanu",
        registrationSuccess: "Kulembetsa kwabwerera bwino! Mwalandira inshuwaransi.",
        registrationFailed: "Kulembetsa sikunagwire. Chonde yesaninso.",
        claimSubmitted: "Cholinga chanu chatumizidwa bwino.",
        claimFailed: "Kulemba cholinga sikunagwire. Chonde yesaninso.",
        noPolicyFound: "Palibe inshuwaransi yanu. Chonde lembani kaye.",
        invalidName: "Dzina silinoyenera. Chonde gwiritsani mawu okha (2-50).",
        invalidAge: "Zaka silinoyenera. Chonde lembani nambala pakati pa 18 ndi 120.",
        notRegistered: "Muyenera kulembetsa kaye. Sankhani njira 1.",
        systemError: "Vuto la system. Chonde yesaninso."
      }
    };
    
    return translations[language] || translations.en;
  }

  getErrorMessage(type, language = 'en') {
    const translations = this.getTranslations(language);
    return `END ${translations[type] || translations.systemError}`;
  }

  validateName(name) {
    return name && name.length >= 2 && name.length <= 50 && /^[a-zA-Z\s]+$/.test(name);
  }

  validateAge(age) {
    const ageNum = parseInt(age);
    return !isNaN(ageNum) && ageNum >= 18 && ageNum <= 120;
  }

  sanitizePhoneNumber(phoneNumber) {
    return phoneNumber.replace(/\D/g, '');
  }

  getOrCreateSession(sessionId, phoneNumber) {
    if (!this.sessions[sessionId]) {
      this.sessions[sessionId] = {
        phoneNumber,
        createdAt: new Date(),
        lastAccessed: new Date()
      };
    } else {
      this.sessions[sessionId].lastAccessed = new Date();
    }
    return this.sessions[sessionId];
  }

  cleanupSessions() {
    const now = new Date();
    for (const sessionId in this.sessions) {
      if (now - this.sessions[sessionId].lastAccessed > this.sessionTimeout) {
        delete this.sessions[sessionId];
      }
    }
  }
}

module.exports = new USSDService();