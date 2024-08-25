import React from "react";
import {
  Box,
  Button,
  Card,
  CardBody,
  HStack,
  Input,
  Link,
  Select,
  Tag,
  Text,
  Textarea,
  useToast,
  VStack,
} from "@chakra-ui/react";
import pdfToText from "react-pdftotext";
import { ReadableStream } from "stream/web";
import {
  AudioSpeech,
  generateAudioSpeech,
  generateChatCompletions,
} from "./api/openai";

function App() {
  const [pdfFile, setPdfFile] = React.useState<File | null>(null);
  const [content, setContent] = React.useState("");
  const [text, setText] = React.useState("");
  const [audioUrl, setAudioUrl] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingPdfToText, setIsLoadingPdfToText] = React.useState(false);
  const [isLoadingAiChat, setIsLoadingAiChat] = React.useState(false);
  const toast = useToast();
  const voices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
  const [aiVoice, setAiVoice] = React.useState("");

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.files && setPdfFile(e.target.files[0]);
  };

  const handlePdfFile = async () => {
    if (!pdfFile) {
      toast({
        title: "請選擇檔案",
        status: "warning",
        isClosable: true,
      });
      return;
    }
    try {
      setIsLoadingPdfToText(true);
      const text = await pdfToText(pdfFile);
      setText(text.replace(/ /g, ""));
      setIsLoadingPdfToText(false);
    } catch (error) {
      toast({
        title: "pdf to text failed",
        description: JSON.stringify(error),
        status: "warning",
        isClosable: true,
      });
    }
  };

  const handleTextFile = () => {
    const file = pdfFile;

    if (!file) {
      toast({
        title: "請選擇檔案",
        status: "warning",
        isClosable: true,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setText(text.replace(/\s/g, ""));
    };
    reader.readAsText(file);
  };

  async function processAudioReader(reader: ReadableStreamDefaultReader) {
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        const blob = new Blob(chunks, { type: "audio/mp3" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        break;
      }
      chunks.push(value);
    }
  }
  const handleTextToSpeech = async () => {
    try {
      if (!content) {
        toast({
          title: `內容不可為空`,
          status: "warning",
          isClosable: true,
        });
        return;
      }
      setIsLoading(true);

      const response = await generateAudioSpeech({
        input: content.replace(/\s/g, ""),
        voice: aiVoice,
      } as AudioSpeech);

      const stream = response.body as ReadableStream;
      if (stream) {
        const reader = stream.getReader();
        await processAudioReader(reader);
        setIsLoading(false);
        toast({
          title: `轉換成功`,
          status: "success",
          isClosable: true,
        });
      }
    } catch (error: any) {
      toast({
        title: error.message,
        status: "error",
        isClosable: true,
      });
    }
  };

  const aiChat = async () => {
    try {
      setIsLoadingAiChat(true);
      const res = await generateChatCompletions([
        {
          role: "system",
          content:
            //"你是一個文章的朗讀者，朗讀 '文章內容' 文章內容中有類似圖片或表格的文字跳過不要念。",
            "請整理 '書本內容'，使用 json 格式區分章節，章節名稱為 'key'，章節內容為 'value'",
        },
        {
          role: "user",
          content: `書本內容: \`\`\`${text}\`\`\``,
        },
      ]);

      // Read the body as a stream
      const reader = res.body?.getReader();
      const chunks: Uint8Array[] = [];

      if (!reader) {
        console.error("No response body");
        return;
      }
      let done: boolean | undefined = false;
      while (!done) {
        const { done: isDone, value } = await reader.read();
        done = isDone;
        if (value) {
          chunks.push(value);
        }
      }

      // Combine the chunks into a single Uint8Array
      const fullChunk = new Uint8Array(
        chunks.reduce((acc, chunk) => acc + chunk.length, 0),
      );
      let offset = 0;
      for (const chunk of chunks) {
        fullChunk.set(chunk, offset);
        offset += chunk.length;
      }

      // Convert Uint8Array to string
      const _text = new TextDecoder().decode(fullChunk);

      // Parse the string as JSON
      const textJson = JSON.parse(_text);

      console.log({ textJson });
      setIsLoadingAiChat(false);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        {false && (
          <Card>
            <CardBody>
              <Button
                colorScheme="blue"
                isLoading={isLoadingPdfToText}
                onClick={handlePdfFile}
              >
                trans pdf to text
              </Button>

              <Button
                colorScheme="blue"
                isLoading={isLoadingAiChat}
                onClick={aiChat}
              >
                ai chat
              </Button>

              {/* <Button colorScheme="blue" onClick={handleTextFile}> */}
              {/*   show text */}
              {/* </Button> */}
              <Input
                placeholder="Select Your file"
                size="md"
                type="file"
                onChange={handleUpload}
              />
              <Card overflowY="auto" h="500px">
                <CardBody>
                  <Text fontSize="md">{text}</Text>
                </CardBody>
              </Card>
            </CardBody>
          </Card>
        )}
        <Box p={10}>
          <VStack spacing={2} align="flex-start">
            <HStack spacing={4}>
              <Text>
                {`PDF 轉檔可以參考: `}
                <Link
                  href="https://www.pdf2go.com/result#j=6f5ce518-4e6e-4b0f-82e0-e369ae28d2a2"
                  color="teal.500"
                  w="100px"
                  isExternal
                >
                  PDF to Text
                </Link>
              </Text>
              <Tag size="lg">
                字數: {content.replace(/\s/g, "").length} (最多 4096 個字)
              </Tag>
              <Select
                w="100px"
                placeholder="AI 聲音"
                onChange={(e) => {
                  setAiVoice(e.target.value);
                }}
              >
                {voices.map((voice) => {
                  return (
                    <option key={voice} value={voice}>
                      {voice}
                    </option>
                  );
                })}
              </Select>
            </HStack>
            <Textarea
              h="70vh"
              onChange={(e) => {
                setContent(e.target.value);
              }}
              placeholder="請輸入文字"
            />
            <Button
              colorScheme="blue"
              isLoading={isLoading}
              onClick={handleTextToSpeech}
            >
              開始轉換
            </Button>
            <audio controls src={audioUrl}></audio>
          </VStack>
        </Box>
      </header>
    </div>
  );
}

export default App;
