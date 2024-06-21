import React, { useState, useRef, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import { detectVideo, onLoadedData } from "./utils/detection/detect";
import { Webcam } from "./utils/detection/webcam";
import "./DetectionModel.css";
import { useAuth } from "./context/UserContext";
import { toast } from "react-toastify";

export default function ModelLoader() {
  // const [isHidden, setIsHidden] = useState(true);
  const { isWebcamHidden, setIsWebcamHidden } = useAuth();
  const [isModelLoading, setIsModelLoading] = useState({
    loading: true,
    progress: 0,
  });
  const [model, setModel] = useState({
    net: null,
    inputShape: [1, 0, 0, 3],
  });
  const [streaming, setStreaming] = useState();
  const webcam = new Webcam();

  const cameraRef = useRef(null);
  const canvasRef = useRef(null);
  const { userMail } = useAuth();

  // model config
  const modelName = "fire_detector";
  const classThreshold = 0.25;

  useEffect(() => {
    tf.ready().then(async () => {
      const model_url = `${window.location.origin}/${modelName}_yolov5n_web_model/model.json`;
      const yolov5 = await tf.loadGraphModel(model_url, {
        onProgress: (fraction) => {
          setIsModelLoading({
            loading: true,
            progress: fraction,
          });
        },
      });
      const dummyInput = tf.ones(yolov5.inputs[0].shape);
      const warmupResult = await yolov5.executeAsync(dummyInput);
      tf.dispose(warmupResult);
      tf.dispose(dummyInput);

      setIsModelLoading({ loading: false, progress: 1 });
      setModel({
        net: yolov5,
        inputShape: yolov5.inputs[0].shape,
      }); // set model & input shape
      console.log("Model Loaded");
      setTimeout(handleStartWebcam, 1000);
    });
  }, []);

  async function handleStartWebcam() {
    if (streaming) {
      webcam.close(cameraRef.current);
      cameraRef.current.style.display = "none";
      setStreaming(null);
      return;
    }
    webcam.open(cameraRef.current, (stream) => onLoadedData(stream, userMail));
    cameraRef.current.style.display = "block";
    setStreaming("camera");
  }

  return (
    <div
      className={`${
        isWebcamHidden
          ? "opacity-[2%] left-[0%] top-[70%]"
          : "opacity-100 left-0 top-0"
      } absolute z-20 w-screen h-screen flex flex-col items-center justify-center bg-white bg-opacity-50`}
    >
      <div className="bg-gray-50 p-4 w-fit h-fit rounded">
        {isModelLoading.loading ? (
          <div className="flex flex-col items-center justify-normal text-center">
            <h1 className="font-bold">Loading Model</h1>
            <p>{Math.round(isModelLoading.progress * 100)}%</p>
          </div>
        ) : (
          <div className="detection-model-container">
            <video
              autoPlay
              muted
              ref={cameraRef}
              onPlay={() =>
                detectVideo(
                  cameraRef.current,
                  model,
                  classThreshold,
                  canvasRef.current,
                  () => {
                    try {
                      console.log("Function Called");
                      toast(
                        `Fire Detected Time ${new Date(Date.now()).toString()}`
                      );
                    } catch (error) {
                      console.error("Error displaying toast:", error);
                    }
                  }
                )
              }
            />
            <canvas
              width={model.inputShape[1]}
              height={model.inputShape[2]}
              ref={canvasRef}
            />
          </div>
        )}
        {/* <button onClick={handleStartWebcam}>Start Detection</button> */}
        <div className="w-full flex items-center justify-center">
          <button
            className="bg-black py-1 px-3 text-white rounded my-4"
            onClick={() => setIsWebcamHidden(true)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
