"use client"

import { use, useContext, useEffect, useState } from "react"
import useDraw from "../../../hooks/useDraw"
import { CirclePicker } from "react-color"
import { io } from "socket.io-client"
import onDraw from "../../../utils/onDraw"
import getCanvasSize from "../../../utils/getCanvasSize"
import { UserContext } from "../../layout"

const serverUrl =
    process.env.NODE_ENV === "production"
        ? "https://next-paint-io.onrender.com"
        : "http://localhost:3001"

const socket = io(serverUrl)

interface ParamsProps {
    params: RoomProps
}

const Room = ({ params }: ParamsProps) => {
    const { setUser, user } = useContext(UserContext)
    const roomId = params.id
    const [color, setColor] = useState("#000")
    const [size, setSize] = useState<5 | 7.5 | 10>(5)

    const onCreate = ({ currentPoints, ctx, prePoints }: OnDraw) => {
        socket.emit("onDraw", { currentPoints, prePoints, color, size, roomId })

        onDraw({ currentPoints, ctx, prePoints, color, size })
    }

    const { canvasRef, onMouseDown, handleClear } = useDraw(onCreate)
    const [canvasSize, setCanvasSize] = useState({ width: 500, height: 500 })

    useEffect(() => {
        const ctx = canvasRef.current?.getContext("2d")

        const { height, width } = getCanvasSize()
        setCanvasSize({ height, width })

        socket.emit("join-room", { roomId })

        socket.emit("client-ready", roomId, user.name)

        socket.on("update-members", (name: string) => {
            setUser((e: UserProps) => ({ ...e, members: [...e.members, name] }))
        })

        socket.on("get-state", () => {
            if (!canvasRef.current?.toDataURL()) return

            socket.emit("canvas-state", canvasRef.current.toDataURL(), roomId)
        })

        socket.on("canvas-state-from-server", (state: string) => {
            const img = new Image()
            img.src = state
            img.onload = () => {
                ctx?.drawImage(img, 0, 0)
            }
        })

        return () => {
            socket.off("get-state")
            socket.off("canvas-state-from-server")
        }
    }, [])

    useEffect(() => {
        const ctx = canvasRef.current?.getContext("2d")

        socket.on("onDraw", ({ currentPoints, prePoints, color, size }) => {
            if (!ctx) return

            onDraw({ currentPoints, ctx, prePoints, color, size })
        })

        socket.on("handleClear", handleClear)

        return () => {
            socket.off("onDraw")
            socket.off("handleClear")
        }
    }, [canvasRef])

    return (
        <main
            style={{
                backgroundImage: "url(../bg.svg)",
                backgroundSize: "cover",
            }}
            className="min-h-screen py-10 "
        >
            {/*   Title    */}
            <h1 className="p-2 mx-auto text-3xl font-bold text-center text-white bg-black rounded-md md:text-5xl w-max">
                Next-Paint.io
            </h1>
            <h1 className="p-2 mx-auto mt-8 text-2xl font-bold text-center text-white bg-black rounded-md md:text-4xl w-max">
                Room ID : {roomId}
            </h1>
            <div className="flex flex-col items-center justify-center mt-20 lg:flex-row gap-x-10 ">
                <div className="flex flex-col gap-4">
                    <div className="flex p-4 pt-2 bg-white border-2 border-black rounded-lg gap-x-6">
                        {/*        Color Picker  */}
                        <div>
                            <h1 className="pb-3 text-xl text-center">
                                Pick Color
                            </h1>
                            <CirclePicker
                                color={color}
                                onChange={(e) => setColor(e.hex)}
                            />
                        </div>
                        {/*         Size Picker     */}
                        <div>
                            <h1 className="pb-3 text-xl text-center">Size</h1>
                            <div
                                style={{ color: color }}
                                className="flex flex-col items-center justify-center gap-y-5"
                            >
                                <ColorCircle
                                    style={"small"}
                                    size={size}
                                    setSize={setSize}
                                />
                                <ColorCircle
                                    style={"mid"}
                                    size={size}
                                    setSize={setSize}
                                />
                                <ColorCircle
                                    style={"large"}
                                    size={size}
                                    setSize={setSize}
                                />
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => socket.emit("handleClear", roomId)}
                        className="px-8 py-2 m-2 bg-white border-2 border-black rounded-md"
                    >
                        Clear
                    </button>
                </div>
                <canvas
                    ref={canvasRef}
                    onMouseDown={onMouseDown}
                    className="bg-white border-4 border-black rounded-md"
                    width={canvasSize.width}
                    height={canvasSize.height}
                />
            </div>
        </main>
    )
}

export default Room

const ColorCircle = ({ style, setSize, size }: ColorCicleProps) => {
    const circleSize = style == "small" ? 1 : style == "mid" ? 1.5 : 2.25
    const brushSize = style == "small" ? 5 : style == "mid" ? 7.5 : 10

    const handleSize = () => {
        setSize(brushSize)
    }

    return (
        <div
            onClick={handleSize}
            style={{ width: `${circleSize}rem`, height: `${circleSize}rem` }}
            className={` text-inherit rounded-full hover:scale-125 transition-all cursor-pointer
            ${size == brushSize ? "border-[3px] border-current" : "bg-current"}
            `}
        ></div>
    )
}