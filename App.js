import React from 'react';
import {StyleSheet, Text, View, Button, SafeAreaView} from 'react-native';
import {BottomSheet} from "./BottomSheet";

export default class App extends React.Component {
    showSheet = () => {
        if (this.bottomSheet) this.bottomSheet.minimize();
    };

    dismissSheet = () => {
        if (this.bottomSheet) this.bottomSheet.dismiss();
    };

    bottomSheet: BottomSheet;

    setBottomSheet = (ref: ?BottomSheet) => {
        if (ref) this.bottomSheet = ref;
    };

    render() {
        console.log("hit here");
        const scrollText =
            "Scroll Me Please, This Text Is Meant To Be Very Long";
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.buttonContainer}>
                    <Button title="show sheet" onPress={this.showSheet}/>
                </View>
                <BottomSheet
                    peekViewHeight={150}
                    ref={this.setBottomSheet}
                    stickyHeaderIndices={[0]}
                    style={{backgroundColor: "#fff"}}
                >
                    <Text style={styles.textStyle}>{scrollText}</Text>
                </BottomSheet>
            </SafeAreaView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonContainer: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center"
    },
    textStyle: {
        width: "100%",
        height: "100%",
        backgroundColor: "#fff"
    }
});
