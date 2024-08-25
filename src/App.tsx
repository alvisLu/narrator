import React from "react";
import {
  Button,
  Card,
  CardBody,
  Input,
  Text,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import pdfToText from "react-pdftotext";
import { ReadableStream } from "stream/web";
import { AudioSpeech, generateAudioSpeech } from "./api/openai";

function App() {
  const [pdfFile, setPdfFile] = React.useState<File | null>(null);
  const [content, setContent] = React.useState("");
  const [audioUrl, setAudioUrl] = React.useState("123");
  const [isLoading, setIsLoading] = React.useState(false);
  const toast = useToast();

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
      const text = await pdfToText(pdfFile);
      setContent(text);
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
      setContent(text);
    };
    reader.readAsText(file);
  };

  async function processReader(reader: ReadableStreamDefaultReader) {
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

  // input example
  //"1-1 通貨膨脹會偷走你的錢\n\n在日常生活中，存在著一位我們看不見的小偷，悄悄偷走我們辛苦賺來的金錢。大多數的民眾對這件事情都很無感，因為當他們翻開皮夾、看見帳戶的數字時，金額並不會有任何變動；因此他們沒有意識到，儘管數字沒有變少，但實際上我們能買到的東西，早已不如從前。\n\n二十年前珍珠奶茶初露頭角，身為學生的我總是喜歡來一杯珍奶，我當時購買的價格就是全台統一的25元；而時隔多年之後，珍珠奶茶一杯已經要價50元；當初只要5元的養樂多，現在也要8元以上。換句話說，雖然我們的錢沒有真的被偷走，實際買得到的東西卻變少了。讓實際購買力下降的罪魁禍首，就是「通貨膨脹」。\n\n根據台灣行政院主計處的統計資料，1981年的消費者物價指數為55.24，2021年6月底的數字為104.14，換算為年化報酬率得到的年通膨率為1.6％，遠高於目前0.8％的定存利率。\n\n想想你在四十年前好不容易省吃儉用，存下第一桶金100萬，隨著時間過去，你猜猜目前的實質購買力剩下多少呢？只剩52萬多，很誇張吧？你有將近一半的資產都被通膨給偷走了。",
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
        input: content,
        voice: "alloy",
      } as AudioSpeech);

      const stream = response.body as ReadableStream;
      if (stream) {
        const reader = stream.getReader();
        await processReader(reader);
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

  return (
    <div className="App">
      <header className="App-header">
        <Card>
          <CardBody>
            <Button colorScheme="blue" onClick={handlePdfFile}>
              trans pdf to text
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
                <Text fontSize="md">{content}</Text>
              </CardBody>
            </Card>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
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
          </CardBody>
        </Card>
      </header>
    </div>
  );
}

export default App;
