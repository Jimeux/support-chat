export class PusherClient {

  constructor(sessionToken) {
    this.sessionToken = sessionToken
    this.pusher = null
  }

  connect() {
    this.pusher = new Pusher('655a7bd7ad1d119d0d4d', {
      auth: {
        headers: {
          'Session-Token': this.sessionToken
        }
      },
      cluster: 'ap3',
      forceTLS: true
    })
  }

}
