import { StatusBar } from "expo-status-bar";
import { Button, SafeAreaView, Text, View, Image } from "react-native";
import { useEffect, useRef, useState } from "react";
import { Camera, CameraCapturedPicture, FlashMode } from "expo-camera";
import { shareAsync } from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import styles from "./style";

export default function App() {
  let cameraRef = useRef<Camera>(null);
  const [flashMode, setFlashMode] = useState<FlashMode>(FlashMode.off);
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | null
  >(null);
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState<
    boolean | null
  >(null);
  const [photo, setPhoto] = useState<CameraCapturedPicture | undefined>();
  const [showPermissionMessage, setShowPermissionMessage] = useState(false);

  useEffect(() => {
    (async () => {
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      const mediaLibraryPermission =
        await MediaLibrary.requestPermissionsAsync();
      setHasCameraPermission(cameraPermission.status === "granted");
      setHasMediaLibraryPermission(mediaLibraryPermission.status === "granted");
    })();
  }, []);

  // Função para exibir a mensagem de permissão
  const handleShowPermissionMessage = () => {
    setShowPermissionMessage(true);
  };

  // Função para solicitar permissão da câmera
  const requestCameraPermission = async () => {
    const cameraPermission = await Camera.requestCameraPermissionsAsync();
    setHasCameraPermission(cameraPermission.status === "granted");
    setShowPermissionMessage(false); // Oculta a mensagem de permissão após solicitar permissão
  };

  if (
    hasCameraPermission === false ||
    hasMediaLibraryPermission === false ||
    showPermissionMessage
  ) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Desculpe, não foi dada permissão.</Text>
        <Button title="Conceder Permissão" onPress={requestCameraPermission} />
      </SafeAreaView>
    );
  }

  if (hasCameraPermission === null || hasMediaLibraryPermission === null) {
    // Alterado para verificar o estado "null"
    return <Text>Requesting permissions...</Text>;
  }

  let takePic = async () => {
    if (cameraRef.current) {
      let options = {
        quality: 1, // controla o nivel de compressão da imagem da qualidade original, 1 significa
        // capturar sem compressão, ja valores abaixo, significa aplicar compressão a qualidade original
        base64: true, // codifica a imagem em string base64, no caso, ela é convertida em uma representação de
        // texto, podendo ser transmitidade ou armazenada, facilmente pode ser usada em uma tag img sem precisar
        // salvar um arquivo, porém, a imagem fica mais pesada do que se salvassemos em binário,
        // em tese aumentar 33% comparação com a versão binária
        exif: false, // o exif é um formato para armazenar metadados associados a imagens, como
        // informações sobre a camera, configurações de captura, data e hora, localização geográfica e
        // outras coisas
        flashMode: flashMode,
      };

      try {
        console.log("Flash Mode:", flashMode);
        let newPhoto = await cameraRef.current.takePictureAsync(options);
        setPhoto(newPhoto);
      } catch (error) {
        console.error("Error taking picture:", error);
      }
    }
  };

  if (photo) {
    let sharePic = () => {
      shareAsync(photo.uri).then(() => {
        setPhoto(undefined);
      });
    };

    let savePhoto = () => {
      MediaLibrary.saveToLibraryAsync(photo.uri).then(() => {
        setPhoto(undefined);
      });
    };

    return (
      <SafeAreaView style={styles.container}>
        <Image
          style={styles.preview}
          source={{ uri: "data:image/jpg;base64," + photo.base64 }}
        />
        <Button title="Share" onPress={sharePic} />
        {hasMediaLibraryPermission ? (
          <Button title="Save" onPress={savePhoto} />
        ) : undefined}
        <Button title="Discard" onPress={() => setPhoto(undefined)} />
      </SafeAreaView>
    );
  }

  return (
    <Camera style={styles.container} ref={cameraRef}>
      <View style={styles.buttonContainer}>
        <Button title="Take Pic" onPress={takePic} />
        <Button
          title="Flash: Off"
          onPress={() => setFlashMode(FlashMode.off)}
        />
        <Button title="Flash: On" onPress={() => setFlashMode(FlashMode.on)} />
        <Button
          title="Flash: Auto"
          onPress={() => setFlashMode(FlashMode.auto)}
        />
      </View>
      <StatusBar style="auto" />
    </Camera>
  );
}
