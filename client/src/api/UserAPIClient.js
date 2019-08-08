export class UserAPIClient {

  constructor(sessionToken) {
    this.sessionToken = sessionToken
  }

  sendMessage(text) {
    const url = '/message'
    const data = {text}

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
