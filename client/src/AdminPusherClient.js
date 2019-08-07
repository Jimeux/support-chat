export class AdminPusherClient {

  constructor(sessionToken) {
    this.sessionToken = sessionToken
    this.subscribedUserChannels = new Map()
  }

  connect(onConnect, onJoin, onLeave) {
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

    const channel = this.pusher.subscribe('presence-channel')
    channel.bind('pusher:subscription_succeeded', members => {
      const users = []
      members.each(m => {
        if (m.id !== members.me.id) // todo what about other admins?
          users.push(this.toUser(m))
      })
      onConnect(users)
    })
    channel.bind('pusher:member_added', member => onJoin(this.toUser(member)))
    channel.bind('pusher:member_removed', member => onLeave(this.toUser(member)))
  }

  disconnect() {
    if (this.pusher == null)
      return

    this.pusher.unsubscribe('presence-channel')
    this.subscribedUserChannels.forEach(v => this.pusher.unsubscribe(v.name))
    this.subscribedUserChannels.clear()
    // this.pusher.disconnect()
    this.pusher = null
  }

  toggleUserConnection(id, onMessage, onTyping) {
    if (this.pusher == null)
      return

    if (this.subscribedUserChannels.has(id)) {
      this.pusher.unsubscribe(`private-${id}`)
      this.subscribedUserChannels.delete(id)
    } else {
      const name = `private-${id}`
      const channel = this.pusher.subscribe(name)
      channel.bind('user-message', onMessage)
      channel.bind('client-user-typing', onTyping)
      this.subscribedUserChannels.set(id, {
        channel,
        name
      })
    }

    return Array.from(this.subscribedUserChannels.keys())
  }

  triggerTypingEvent(userId) {
    if (!this.subscribedUserChannels.has(userId))
      return

    this.subscribedUserChannels.get(userId)
        .channel.trigger('client-operator-typing', {})
  }

  toUser(member) {
    return { // todo define this as a class
      id: member.id,
      name: member.info.name,
      connected: false,
      messages: [],
      typing: false,
      typingTimeout: null,
      beingTyped: false,
      beingTypedTimeout: null
    }
  }
}
