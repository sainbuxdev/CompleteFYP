import * as tf from "@tensorflow/tfjs";
import { renderBoxes } from "./renderBox";

/**
 * Preprocess image / frame before forwarded into the model
 * @param {HTMLVideoElement|HTMLImageElement} source
 * @param {Number} modelWidth
 * @param {Number} modelHeight
 * @returns input tensor, xRatio and yRatio
 */
const preprocess = (source, modelWidth, modelHeight) => {
  let xRatio, yRatio; // ratios for boxes

  const input = tf.tidy(() => {
    const img = tf.browser.fromPixels(source);

    // padding image to square => [n, m] to [n, n], n > m
    const [h, w] = img.shape.slice(0, 2); // get source width and height
    const maxSize = Math.max(w, h); // get max size
    const imgPadded = img.pad([
      [0, maxSize - h], // padding y [bottom only]
      [0, maxSize - w], // padding x [right only]
      [0, 0],
    ]);

    xRatio = maxSize / w; // update xRatio
    yRatio = maxSize / h; // update yRatio

    return tf.image
      .resizeBilinear(imgPadded, [modelWidth, modelHeight]) // resize frame
      .div(255.0) // normalize
      .expandDims(0); // add batch
  });

  return [input, xRatio, yRatio];
};

let startRecording = false;
let recordingTimeout;
let mediaRecorder;
let recordedChunks = [];
let recordingStartTime;
let userEmail;

function stopRecording() {
  startRecording = false;
  if (mediaRecorder) {
    try {
      console.log("Stop Recording");
      mediaRecorder.stop();
    } catch (error) {
      console.error("Error stopping recording:", error);
    }
  }
}

function startRecordingTimeout() {
  recordingStartTime = Date.now();
  recordingTimeout = setTimeout(stopRecording, 5000);
}

function cancelRecordingTimeout() {
  clearTimeout(recordingTimeout);
}

function handleDataAvailable(event) {
  if (event.data.size > 0) {
    recordedChunks.push(event.data);
  }
}

function startRecordingVideo() {
  if (mediaRecorder) {
    mediaRecorder.start();
    console.log("Recording started");
  } else {
    console.error("MediaRecorder is not initialized");
  }
}

/**
 * Function to detect image.
 * @param {HTMLImageElement} imgSource image source
 * @param {tf.GraphModel} model loaded YOLOv5 tensorflow.js model
 * @param {Number} classThreshold class threshold
 * @param {HTMLCanvasElement} canvasRef canvas reference
 */
export const detectImage = async (
  imgSource,
  model,
  classThreshold,
  canvasRef
) => {
  const [modelWidth, modelHeight] = model.inputShape.slice(1, 3); // get model width and height

  tf.engine().startScope(); // start scoping tf engine
  const [input, xRatio, yRatio] = preprocess(
    imgSource,
    modelWidth,
    modelHeight
  );

  await model.net.executeAsync(input).then((res) => {
    const [boxes, scores, classes] = res.slice(0, 3);
    const boxes_data = boxes.dataSync();
    const scores_data = scores.dataSync();
    const classes_data = classes.dataSync();
    renderBoxes(
      canvasRef,
      classThreshold,
      boxes_data,
      scores_data,
      classes_data,
      [xRatio, yRatio]
    ); // render boxes
    tf.dispose(res); // clear memory
  });

  tf.engine().endScope(); // end of scoping
};

/**
 * Function to detect video from every source.
 * @param {HTMLVideoElement} vidSource video source
 * @param {tf.GraphModel} model loaded YOLOv5 tensorflow.js model
 * @param {Number} classThreshold class threshold
 * @param {HTMLCanvasElement} canvasRef canvas reference
 */
export const detectVideo = (
  vidSource,
  model,
  classThreshold,
  canvasRef,
  onDetect
) => {
  const [modelWidth, modelHeight] = model.inputShape.slice(1, 3); //|| [720, 500]; // get model width and height
  /**
   * Function to detect every frame from video
   */

  if (!canvasRef) {
    console.error("Canvas reference is not provided.");
    return;
  }

  if (typeof MediaRecorder === "undefined") {
    console.error("MediaRecorder is not supported in this environment.");
    return;
  }

  const detectFrame = async () => {
    if (vidSource?.videoWidth === 0 && vidSource?.srcObject === null) {
      const ctx = canvasRef.getContext("2d");
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // clean canvas
      return; // handle if source is closed
    }

    tf.engine().startScope(); // start scoping tf engine
    const [input, xRatio, yRatio] = preprocess(
      vidSource,
      modelWidth,
      modelHeight
    );

    await model.net.executeAsync(input).then((res) => {
      const [boxes, scores, classes] = res.slice(0, 3);
      const boxes_data = boxes.dataSync();
      const scores_data = scores.dataSync();
      const classes_data = classes.dataSync();
      renderBoxes(
        canvasRef,
        classThreshold,
        boxes_data,
        scores_data,
        classes_data,
        [xRatio, yRatio]
      ); // render boxes
      if (scores_data[0] !== -1) {
        console.log("Score: ", Math.round(scores_data[0] * 100));
      }

      if (scores_data[0] > 0.4) {
        startRecording = true;
        cancelRecordingTimeout(); // Cancel previous timeout if any
        startRecordingTimeout(); // Start new recording timeout
        if (mediaRecorder.state == "inactive") startRecordingVideo();
        onDetect();
        // console.log(onDetect);
      }

      tf.dispose(res); // clear memory
    });

    requestAnimationFrame(detectFrame); // get another frame
    tf.engine().endScope(); // end of scoping
  };

  detectFrame(); // initialize to detect every frame
};

export const onLoadedData = (stream, email) => {
  mediaRecorder = new MediaRecorder(stream);
  userEmail = email;
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: "video/mp4" });
    console.log(recordedChunks.length);
    // Create FormData object to send the video file
    const formData = new FormData();
    formData.append("video", blob, "fire_detection_video.webm");
    formData.append("userMail", userEmail); // Assuming userEmail is defined somewhere

    // Send POST request to the server
    fetch("http://localhost:3500/getProfileDetails/user/video", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to upload video");
        }
        console.log("Video uploaded successfully");
      })
      .catch((error) => {
        console.error("Error uploading video:", error);
      });
    recordedChunks = [];
  };
};
