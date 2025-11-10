import asyncio, json, cv2, numpy as np, aiohttp
from aiortc import RTCPeerConnection, RTCSessionDescription

async def main():
    async with aiohttp.ClientSession() as session:
        ws = await session.ws_connect("ws://localhost:4000")
        await ws.send_json({"register": "mlserver"})
        pc = RTCPeerConnection()

        @pc.on("track")
        def on_track(track):
            print("Track:", track.kind)
            async def consume():
                while True:
                    frame = await track.recv()
                    img = frame.to_ndarray(format="bgr24")
                    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                    cv2.imshow("ML Stream", gray)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        break
            asyncio.create_task(consume())

        async for msg in ws:
            data = json.loads(msg.data)
            if data["type"] == "offer":
                offer = RTCSessionDescription(sdp=data["sdp"], type="offer")
                await pc.setRemoteDescription(offer)
                answer = await pc.createAnswer()
                await pc.setLocalDescription(answer)
                await ws.send_json({"type": "answer", "sdp": pc.localDescription.sdp})
            elif data["type"] == "candidate":
                try:
                    await pc.addIceCandidate(data["candidate"])
                except Exception:
                    pass

asyncio.run(main())
