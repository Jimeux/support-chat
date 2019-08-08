export class AdminAPIClient {

  constructor(sessionToken) {
    this.sessionToken = sessionToken
  }

  sendResponse(userId, text) {
    const url = '/response'
    const data = {
      user_id: parseInt(userId),
      text: text
    }

    fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'Session-Token': this.sessionToken
      }
    }).catch(error => console.error('Error:', error))
  }

}
