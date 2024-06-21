import { useState, useEffect, useRef } from "react";
import { Webcam } from "./utils/detection/webcam";
import { detectVideo, onLoadedData } from "./utils/detection/detect";
import * as tf from "@tensorflow/tfjs";
import { useAuth } from "./context/UserContext";

export default function UseDetectionModel() {
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
  const { login, loading, error, adminMail, userMail } = useAuth();

  // Model Config
  const modelName = "fire_detector";
  const classThreshold = 0.25;

  function startDetecion() {
    detectVideo(
      cameraRef.current,
      model,
      classThreshold,
      canvasRef.current,
      () => console.log("Fire Detected!")
    );
  }

  useEffect(() => {
    tf.ready().then(async () => {
      const modelUrl = `${window.location.origin}/${modelName}_yolov5n_web_model/model.json`;
      const yolov5 = await tf.loadGraphModel(modelUrl, {
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
      const loadedModel = {
        net: yolov5,
        inputShape: yolov5.inputs[0].shape,
      };
      setModel(loadedModel);
      console.log("Model Loaded -> ", onLoadedData);
      webcam.open(cameraRef.current, (stream) =>
        onLoadedData(stream, userMail)
      );
    });
  }, []);

  return {
    cameraRef,
    canvasRef,
    model,
    isModelLoading,
    streaming,
    startDetecion,
  };
}
