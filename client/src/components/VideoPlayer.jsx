import React from 'react'

const VideoPlayer = ({ stream }) => {
  return (
      <div>VideoPlayer
        
        <video srcObject={stream}></video>

      </div>
  )
}

export default VideoPlayer