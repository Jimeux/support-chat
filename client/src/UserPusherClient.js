export class UserPusherClient {

  constructor(userId, sessionToken) {
    this.userId = userId
    this.sessionToken = sessionToken
    this.myChannel = null
    this.roomChannel = null
  }

  connect(onConnect, onReceiveMessage, onOperatorTyping) {
    if (this.pusher != null)
      return

    this.pusher = new Pusher('655a7bd7ad1d119d0d4d', {
      auth: {
        headers: {
          'Session-Token': this.sessionToken
        }
      },
      cluster: 'ap3',
      forceTLS: true
    })

    this.roomChannel = this.pusher.subscribe('presence-channel')
    this.roomChannel.bind('pusher:subscription_succeeded', onConnect)

    this.myChannel = this.pusher.subscribe(`private-${this.userId}`)
    this.myChannel.bind('operator-message', onReceiveMessage)
    this.myChannel.bind('client-operator-typing', onOperatorTyping)
  }

  disconnect() {
    if (this.pusher == null)
      return

    this.pusher.unsubscribe('presence-channel')
    this.pusher.unsubscribe(`private-${this.userId}`)
    this.pusher = null
    this.myChannel = null
    this.roomChannel = null
  }

  triggerTypingEvent() {
    if (this.myChannel == null)
      return

    this.myChannel.trigger('client-user-typing', {userId: this.userId})
  }

}
