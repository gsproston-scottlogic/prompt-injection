import { View, StyleSheet } from '@react-pdf/renderer';
import { Fragment } from 'react';

import ExportChatMessage from './ExportChatMessage';

import { ChatMessage } from '@src/models/chat';

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
	},
});

function ExportChatBox({ items }: { items: ChatMessage[] }) {
	const rows = items.map((item, index) => (
		<View style={styles.row} key={index}>
			<ExportChatMessage message={item} />
		</View>
	));
	return <Fragment>{rows}</Fragment>;
}

export default ExportChatBox;
