class PeerService {
    
    constructor () {
        if(!this.peer){
            this.peer = new RTCPeerConnection({
                iceServers: [
                    {
                        urls: 
                        [
                            "stun:stun.l.google.com:19302", 
                            "stun:global.stun.twilio.com:3478"
                        ]
                    }
                ]
            })
        }
    }

    async getAnswer(offer) {
        // Check if the peer connection object exists 
        if (this.peer) {
            // Step 1: User B(RECEIVER) receives the offer from User A(CAllER) and sets it as the remote description
            await this.peer.setRemoteDescription(offer);
            
            // Step 2: User B creates an SDP answer after processing A's offer
            const ans = await this.peer.createAnswer();
            
            // Step 3: User B sets the created answer as its local description
            await this.peer.setLocalDescription(new RTCSessionDescription(ans));
            
            // Step 4: User B returns the answer, which will be sent back to User A and User A will set this to his remote description
            return ans;
        }
    }

    async getOffer() {
        if(this.peer){
            // Step 1: User A creates an SDP offer
            const offer = await this.peer.createOffer();
            
            // Step 2: User A sets the offer as its local description
            await this.peer.setLocalDescription(new RTCSessionDescription(offer));
            
            // Step 3: User A returns the offer, which will be sent back to User B
            return offer;
        }
    }

    async setRemoteLocalDescription (ans) {
            if(this.peer) {
                // Step 1: User B receives the answer from User A and sets it as the remote description
                await this.peer.setRemoteDescription(new RTCSessionDescription(ans));
            }
    }
    
}

export default new PeerService();