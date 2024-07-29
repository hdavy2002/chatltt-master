import { CloudArrowUp } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import showToast from "../../../../../utils/toast";
import System from "../../../../../models/system";
import { useDropzone } from "react-dropzone";
import { v4 } from "uuid";
import FileUploadProgress from "./FileUploadProgress";
import Workspace from "../../../../../models/workspace";
import debounce from "lodash.debounce";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB in bytes
const ALLOWED_FILE_TYPES = [
  'text/plain',     // .txt
  'text/csv',       // .csv
  'audio/mpeg',     // .mp3
  'application/pdf' // .pdf
];

export default function UploadFile({
  workspace,
  fetchKeys,
  setLoading,
  setLoadingMessage,
}) {
  const [ready, setReady] = useState(false);
  const [files, setFiles] = useState([]);
  const [fetchingUrl, setFetchingUrl] = useState(false);

  const handleSendLink = async (e) => {
    // ... (previous code remains unchanged)
  };

  // Don't spam fetchKeys, wait 1s between calls at least.
  const handleUploadSuccess = debounce(() => fetchKeys(true), 1000);
  const handleUploadError = (msg) => showToast(msg, "error");

  const onDrop = async (acceptedFiles, rejections) => {
    const newAccepted = acceptedFiles.map((file) => ({
      uid: v4(),
      file,
    }));

    const newRejected = rejections.map((file) => ({
      uid: v4(),
      file: file.file,
      rejected: true,
      reason: file.errors[0].code,
    }));

    setFiles([...newAccepted, ...newRejected]);

    rejections.forEach((file) => {
      if (file.file.size > MAX_FILE_SIZE) {
        if (file.file.type === 'audio/mpeg') {
          showToast("File less than 20MB is allowed. Please split your audio into multiple parts. We recommend https://www.veed.io/tools/split-audio", "error");
        } else {
          showToast("Only files below 20MB are allowed.", "error");
        }
      } else if (!ALLOWED_FILE_TYPES.includes(file.file.type)) {
        showToast("Only .txt, .csv, .mp3, and .pdf files are allowed.", "error");
      }
    });
  };

  useEffect(() => {
    async function checkProcessorOnline() {
      const online = await System.checkDocumentProcessorOnline();
      setReady(online);
    }
    checkProcessorOnline();
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    disabled: !ready,
    maxSize: MAX_FILE_SIZE,
    accept: {
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'audio/mpeg': ['.mp3'],
      'application/pdf': ['.pdf']
    },
  });

  return (
    <div>
      <div
        className={`w-[560px] border-2 border-dashed rounded-2xl bg-zinc-900/50 p-3 ${
          ready ? "cursor-pointer" : "cursor-not-allowed"
        } hover:bg-zinc-900/90`}
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        {ready === false ? (
          <div className="flex flex-col items-center justify-center h-full">
            <CloudArrowUp className="w-8 h-8 text-white/80" />
            <div className="text-white text-opacity-80 text-sm font-semibold py-1">
              Document Processor Unavailable
            </div>
            <div className="text-white text-opacity-60 text-xs font-medium py-1 px-20 text-center">
              We can't upload your files right now because the document
              processor is offline. Please try again later.
            </div>
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center">
            <CloudArrowUp className="w-8 h-8 text-white/80" />
            <div className="text-white text-opacity-80 text-sm font-semibold py-1">
              Click to upload or drag and drop
            </div>
            <div className="text-white text-opacity-60 text-xs font-medium py-1">
              Only .txt, .csv, .mp3, and .pdf files up to 20MB are supported
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 overflow-auto max-h-[180px] p-1 overflow-y-scroll no-scroll">
            {files.map((file) => (
              <FileUploadProgress
                key={file.uid}
                file={file.file}
                uuid={file.uid}
                setFiles={setFiles}
                slug={workspace.slug}
                rejected={file?.rejected}
                reason={file?.reason}
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
                setLoading={setLoading}
                setLoadingMessage={setLoadingMessage}
              />
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-6 text-center text-white text-opacity-80 text-xs font-medium w-[560px]">
        These files will be uploaded to the document processor running on this
        ChatLTT instance. These files are not sent or shared with a third
        party.
      </div>
    </div>
  );
}