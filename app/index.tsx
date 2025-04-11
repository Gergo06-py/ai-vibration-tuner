import { useEffect, useState } from "react";
import { Button, Text, TextInput, Vibration, View } from "react-native";

export default function Index() {
  type Result = {
    option1: {
      vibrations: number[];
      delays: number[];
    };
    option2: {
      vibrations: number[];
      delays: number[];
    };
    preferred: string;
    feedback?: string;
  };

  const [response, setResponse] = useState("Loading...");
  const [isLoading, setIsLoading] = useState(true);
  const [testCount, setTestCount] = useState(0);
  const [previousResults, setPreviousResults] = useState<Result[]>([]);
  const [currentResult, setCurrentResult] = useState<Result>({
    option1: {
      vibrations: [],
      delays: [],
    },
    option2: {
      vibrations: [],
      delays: [],
    },
    preferred: "",
    feedback: "",
  } as Result);
  const [feedback, setFeedback] = useState("");
  const prompt =
    "Your job is to create the perfect vibration method for a phone's short button press vibration using timing in the following format: " +
    "[" +
    "{" +
    '"option1": {' +
    '"vibrations": [v1, v2, ...],' +
    '"delays": [d1, d2, ...]' +
    "}," +
    '"option2": {' +
    '"vibrations": [v1, v2,...],' +
    '"delays": [d1, d2,...]' +
    "}," +
    "}" +
    "] where: v_ = the amount of time in milliseconds the phone should vibrate for; d_ = the delay between vibrations (the last one must always be 0)" +
    "The previous data results: [" +
    +"] " +
    "Create the new vibration amounts with delays based on feedbacks and the previous preferred options. Your goal is to create a vibration that is as natural as possible and does not cause any discomfort or fatigue for the user." +
    'Feedback from the user: "' +
    feedback +
    '"' +
    "Provide me with 2 options that the user can choose from:" +
    "(only respond in the format provided above, no additional text and do not use code blocks)";

  const reapeatedVibration = (vibrations: number[], delays: number[]) => {
    let delaySum = 0;
    for (let i = 0; i < vibrations.length; i++) {
      setTimeout(() => {
        Vibration.vibrate(vibrations[i]);
      }, delaySum);
      delaySum += vibrations[i] + delays[i];
    }
  };

  const generateOptions = async () => {
    const fetchResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization:
            "Bearer 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",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openrouter/quasar-alpha",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      }
    );
    const data = await fetchResponse.json();

    if (
      !data?.choices ||
      data.choices.length === 0 ||
      !data.choices[0].message?.content
    ) {
      console.error("Unexpected API response:", data);
      setResponse("API error or empty response");
      return;
    }

    const result = JSON.parse(data.choices[0].message.content);
    setCurrentResult(result[0] as Result);
    return result;
  };

  function setPreferredOption(option: string, feedback?: string) {
    if (isLoading) {
      return;
    }
    setCurrentResult({
      ...currentResult,
      preferred: option,
      feedback: feedback,
    });
    setPreviousResults([...previousResults, currentResult]);
  }

  useEffect(() => {
    setIsLoading(true);
  }, []);

  useEffect(() => {
    if (previousResults.length > 0) {
      setFeedback("");
      setIsLoading(true);
    }
  }, [previousResults]);

  useEffect(() => {
    if (
      currentResult.preferred !== "" &&
      currentResult.preferred !== undefined
    ) {
      setTestCount(testCount + 1);
      setCurrentResult({
        option1: {
          vibrations: [],
          delays: [],
        },
        option2: {
          vibrations: [],
          delays: [],
        },
        preferred: "",
        feedback: "",
      });
    }
  }, [currentResult]);

  useEffect(() => {
    if (isLoading) {
      setResponse("Loading...");
      generateOptions().then((res) => {
        setResponse(formatOptionOutput(res[0] as Result));
        setIsLoading(false);
      });
    }
  }, [isLoading]);

  const formatOptionOutput = (result: Result) => {
    if (!result) {
      return "No result available";
    }
    const option1 = result.option1;
    const option2 = result.option2;
    const option1Output = `Option 1: Vibrations: ${option1.vibrations.join(
      ", "
    )}, Delays: ${option1.delays.join(", ")}`;
    const option2Output = `Option 2: Vibrations: ${option2.vibrations.join(
      ", "
    )}, Delays: ${option2.delays.join(", ")}`;
    return `${option1Output}\n${option2Output}`;
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Which vibration do you prefer?</Text>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          margin: 20,
          gap: 20,
        }}
      >
        <Button
          title="Test vibration 1"
          color={"green"}
          onPress={() =>
            reapeatedVibration(
              currentResult.option1.vibrations,
              currentResult.option1.delays
            )
          }
        />
        <Button
          title="Test vibration 2"
          color={"green"}
          onPress={() =>
            reapeatedVibration(
              currentResult.option2.vibrations,
              currentResult.option2.delays
            )
          }
        />
      </View>
      <Text>{response}</Text>
      <View
        style={{
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          margin: 20,
          gap: 20,
        }}
      >
        <Button
          title="Prefers vibration 1"
          onPress={() => setPreferredOption("option1")}
        />
        <Button
          title="Prefers neither"
          color={"red"}
          onPress={() => setPreferredOption("neither")}
        />
        <Button
          title="Prefers vibration 2"
          onPress={() => setPreferredOption("option2")}
        />
      </View>
      <Text>Feedback:</Text>
      {/* You can adjust how much vibration the AI should give, basically you can give it a prompt to follow */}
      <TextInput
        style={{
          height: 40,
          borderColor: "gray",
          borderWidth: 1,
          margin: 20,
          minWidth: 300,
        }}
        onChangeText={(text) => setFeedback(text)}
        value={feedback}
      />
      <Button title="Clear" color={"black"} onPress={() => setFeedback("")} />
      <Text>{testCount}/10</Text>
    </View>
  );
}
