import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal, TextInput, SafeAreaView, Alert, Dimensions, FlatList } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SvgXml } from 'react-native-svg';
import { GuideOverlay } from '../components/GuideOverlay';

const { width } = Dimensions.get('window');

const LOTO_QUEBEC_LOGO_XML = `<?xml version="1.0" encoding="UTF-8"?><svg id="Calque_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 157 72"><defs><style>.cls-1{fill:#fff;stroke-width:0px;}</style></defs><polygon class="cls-1" points="2.08 23.29 .5 15.52 17.73 15.52 17.73 17.96 3.48 17.96 4.47 22.81 2.08 23.29"/><polygon class="cls-1" points="52.82 48.63 54.4 56.41 37.17 56.41 37.17 53.97 51.42 53.97 50.43 49.12 52.82 48.63"/><path class="cls-1" d="M9.57,35.87v-12.11h5.29c2.44,0,3.92,1.16,3.92,2.99,0,1.14-.64,2.01-1.78,2.44,1.49.52,2.33,1.63,2.33,3.11,0,2.15-1.68,3.56-4.42,3.56h-5.34ZM14.52,25.73h-2.45v2.96h2.45c1.23,0,1.87-.56,1.87-1.49s-.65-1.47-1.87-1.47ZM14.6,30.41h-2.53v3.49h2.53c1.34,0,2.16-.65,2.16-1.74s-.82-1.74-2.16-1.74ZM22.06,22.66c.81,0,1.44.57,1.44,1.4s-.62,1.4-1.44,1.4-1.44-.57-1.44-1.4.62-1.4,1.44-1.4ZM20.85,26.52h2.43v9.35h-2.43v-9.35ZM34.42,31.08c0,.28-.02.54-.03.71h-7.13c.17,1.59,1.13,2.43,2.44,2.43,1.14,0,1.85-.54,2.22-1.39l2.22.68c-.59,1.59-2.22,2.62-4.38,2.62-2.89,0-4.95-1.99-4.95-4.91s2.13-4.91,4.9-4.91,4.73,1.98,4.73,4.77ZM29.68,28.14c-1.18,0-2.1.73-2.37,2.13h4.64c-.21-1.35-1.02-2.13-2.27-2.13ZM38.27,28.5h.18c.47-1.37,1.62-2.2,3.09-2.2,1.94,0,3.34,1.4,3.34,3.88v5.69h-2.43v-5.11c0-1.53-.84-2.36-2.03-2.36s-2.05.83-2.05,2.36v5.11h-2.43v-9.35h2.42l-.09,1.97Z"/><path class="cls-1" d="M6.84,34.95c.81,0,1.44.57,1.44,1.4s-.62,1.4-1.44,1.4-1.44-.57-1.44-1.4.62-1.4,1.44-1.4ZM5.63,48.58v-9.76h2.43v9.9c0,1.79-1,2.81-2.81,2.81-.55,0-1.03-.09-1.46-.26v-2.03c.32.17.63.26.97.26.58,0,.87-.28.87-.92ZM14.45,48.42c-2.77,0-4.88-2.01-4.88-4.91s2.11-4.91,4.88-4.91,4.88,2.01,4.88,4.91-2.11,4.91-4.88,4.91ZM14.45,46.36c1.4,0,2.42-1.06,2.42-2.84s-1.02-2.84-2.42-2.84-2.42,1.06-2.42,2.84,1.02,2.84,2.42,2.84ZM40.96,43.37c0,.28-.02.54-.03.71h-7.13c.17,1.6,1.13,2.43,2.44,2.43,1.14,0,1.85-.54,2.22-1.39l2.22.68c-.59,1.6-2.22,2.62-4.38,2.62-2.89,0-4.95-1.99-4.95-4.91s2.13-4.91,4.9-4.91,4.73,1.98,4.73,4.77ZM36.22,40.44c-1.18,0-2.1.73-2.37,2.13h4.64c-.21-1.35-1.02-2.13-2.27-2.13ZM47.82,38.62h.08v2.5h-.54c-1.69,0-2.48.81-2.48,2.44v4.6h-2.43v-9.35h2.49s-.09,2.44-.09,2.44h.11c.42-1.77,1.33-2.63,2.88-2.63ZM29.86,45.73c0,.9.16,1.64.48,2.44h-2.55c-.22-.64-.29-1.28-.29-1.97h-.21c-.47,1.37-1.62,2.2-3.09,2.2-1.94,0-3.34-1.4-3.34-3.88v-5.69h2.43v5.11c0,1.53.84,2.36,2.03,2.36s2.05-.83,2.05-2.36v-5.11h2.5v6.91Z"/><path class="cls-1" d="M71.84,26.16h3.66c1.99,0,3.23,1.11,3.23,2.86s-1.25,2.85-3.23,2.85h-2.09v2.77h-1.56v-8.47ZM73.4,27.48v3.06h1.92c1.11,0,1.79-.57,1.79-1.53s-.68-1.54-1.79-1.54h-1.92Z"/><path class="cls-1" d="M79.25,31.36c0-2,1.45-3.43,3.38-3.43s3.38,1.43,3.38,3.43-1.45,3.43-3.38,3.43-3.38-1.43-3.38-3.43ZM84.48,31.36c0-1.32-.79-2.12-1.85-2.12s-1.85.8-1.85,2.12.79,2.12,1.85,2.12,1.85-.8,1.85-2.12Z"/><path class="cls-1" d="M93.52,34.63h-1.55c-.17-.46-.23-.9-.23-1.37h-.12c-.34.93-1.16,1.53-2.19,1.53-1.37,0-2.37-1-2.37-2.74v-3.96h1.5v3.6c0,1.14.65,1.76,1.56,1.76s1.56-.62,1.56-1.76v-3.6h1.5v4.83c0,.62.11,1.15.34,1.71Z"/><path class="cls-1" d="M98.32,27.94v1.54h-.25c-1.32,0-1.9.59-1.9,1.78v3.38h-1.5v-6.54h1.5l-.06,1.59h.12c.3-1.15.87-1.74,1.91-1.74h.18Z"/><path class="cls-1" d="M104.21,27.94c1.07,0,1.92.59,2.29,1.68h.12l-.06-1.53h1.5v8.72h-1.5v-2.18l.06-1.53h-.12c-.36,1.09-1.22,1.68-2.29,1.68-1.57,0-2.72-1.38-2.72-3.43s1.15-3.43,2.72-3.43ZM104.81,29.24c-1.03,0-1.8.81-1.8,2.12s.77,2.12,1.8,2.12,1.82-.81,1.82-2.12-.77-2.12-1.82-2.12Z"/><path class="cls-1" d="M115.95,34.63h-1.55c-.17-.46-.23-.9-.23-1.37h-.12c-.34.93-1.16,1.53-2.19,1.53-1.37,0-2.37-1-2.37-2.74v-3.96h1.5v3.6c0,1.14.65,1.76,1.56,1.76s1.56-.62,1.56-1.76v-3.6h1.5v4.83c0,.62.11,1.15.34,1.71Z"/><path class="cls-1" d="M123.33,31.75h-5.08c.12,1.16.85,1.82,1.85,1.82.85,0,1.39-.4,1.67-1.03l1.37.47c-.44,1.08-1.56,1.78-3,1.78-2.02,0-3.43-1.4-3.43-3.43s1.48-3.43,3.39-3.43,3.26,1.39,3.26,3.3c0,.19-.01.39-.02.51ZM118.28,30.72h3.54c-.14-.97-.77-1.59-1.73-1.59-.9,0-1.6.57-1.8,1.59Z"/><path class="cls-1" d="M128.44,34.63h-1.5v-8.72h1.5v8.72Z"/><path class="cls-1" d="M136.15,31.75h-5.08c.12,1.16.85,1.82,1.85,1.82.85,0,1.39-.4,1.67-1.03l1.37.47c-.44,1.08-1.56,1.78-3,1.78-2.02,0-3.43-1.4-3.43-3.43s1.48-3.43,3.39-3.43,3.26,1.39,3.26,3.3c0,.19-.01.39-.02.51ZM131.1,30.72h3.54c-.14-.97-.77-1.59-1.73-1.59-.9,0-1.6.57-1.8,1.59Z"/><path class="cls-1" d="M139.75,28.09h1.5v7c0,1.2-.7,1.88-1.89,1.88-.35,0-.69-.07-.98-.21v-1.28c.25.13.48.21.74.21.41,0,.63-.21.63-.67v-6.92ZM141.41,26.41c0,.52-.4.88-.91.88s-.91-.36-.91-.88.4-.88.91-.88.91.35.91.88Z"/><path class="cls-1" d="M148.96,31.75h-5.08c.12,1.16.85,1.82,1.85,1.82.85,0,1.39-.4,1.67-1.03l1.37.47c-.44,1.08-1.56,1.78-3,1.78-2.02,0-3.43-1.4-3.43-3.43s1.48-3.43,3.39-3.43,3.26,1.39,3.26,3.3c0,.19-.01.39-.02.51ZM143.91,30.72h3.54c-.14-.97-.77-1.59-1.73-1.59-.9,0-1.6.57-1.8,1.59Z"/><path class="cls-1" d="M156.5,34.63h-1.55c-.17-.46-.23-.9-.23-1.37h-.12c-.34.93-1.16,1.53-2.19,1.53-1.37,0-2.37-1-2.37-2.74v-3.96h1.5v3.6c0,1.14.65,1.76,1.56,1.76s1.56-.62,1.56-1.76v-3.6h1.5v4.83c0,.62.11,1.15.34,1.71Z"/><path class="cls-1" d="M75.5,39.28v1.54h-.25c-1.32,0-1.9.59-1.9,1.78v3.38h-1.5v-6.54h1.5l-.06,1.59h.12c.3-1.15.87-1.74,1.91-1.74h.18Z"/><path class="cls-1" d="M82.61,43.1h-5.08c.12,1.16.85,1.82,1.85,1.82.85,0,1.39-.4,1.67-1.03l1.37.47c-.44,1.08-1.56,1.78-3,1.78-2.02,0-3.43-1.4-3.43-3.43s1.48-3.43,3.39-3.43,3.26,1.39,3.26,3.31c0,.19-.01.39-.02.51ZM77.56,42.07h3.54c-.15-.97-.77-1.59-1.73-1.59-.9,0-1.6.57-1.8,1.59Z"/><path class="cls-1" d="M86.08,39.28c1.42,0,2.26.73,2.47,1.78l-1.34.31c-.11-.57-.51-1.02-1.2-1.02-.65,0-.98.31-.98.7,0,1.42,3.74.6,3.74,3.15,0,1.13-.93,1.92-2.72,1.92-1.56,0-2.54-.73-2.75-1.88l1.39-.3c.15.65.59,1.09,1.43,1.09s1.17-.33,1.17-.73c0-1.48-3.7-.68-3.7-3.12,0-1.04.9-1.91,2.49-1.91Z"/><path class="cls-1" d="M101.12,43.1h-5.08c.12,1.16.85,1.82,1.85,1.82.85,0,1.39-.4,1.67-1.03l1.37.47c-.44,1.08-1.56,1.78-3,1.78-2.02,0-3.43-1.4-3.43-3.43s1.48-3.43,3.39-3.43,3.26,1.39,3.26,3.31c0,.19-.01.39-.02.51ZM96.07,42.07h3.54c-.15-.97-.77-1.59-1.73-1.59-.9,0-1.6.57-1.8,1.59Z"/><path class="cls-1" d="M111.15,45.98h-1.55c-.17-.46-.23-.9-.23-1.37h-.12c-.34.93-1.16,1.53-2.19,1.53-1.37,0-2.37-1-2.37-2.74v-3.96h1.5v3.6c0,1.14.65,1.76,1.56,1.76s1.56-.62,1.56-1.76v-3.6h1.5v4.83c0,.62.11,1.15.34,1.71Z"/><path class="cls-1" d="M113.85,40.81c.35-.93,1.17-1.53,2.2-1.53,1.36,0,2.36,1.01,2.36,2.74v3.96h-1.5v-3.6c0-1.14-.64-1.75-1.56-1.75s-1.56.62-1.56,1.75v3.6h-1.5v-6.54h1.5l-.06,1.37h.12Z"/><path class="cls-1" d="M122.33,39.44h1.5v7c0,1.2-.7,1.88-1.89,1.88-.35,0-.69-.07-.98-.21v-1.28c.25.13.48.21.74.21.41,0,.63-.21.63-.67v-6.93ZM123.99,37.76c0,.52-.4.88-.91.88s-.91-.36-.91-.88.4-.88.91-.88.91.35.91.88Z"/><path class="cls-1" d="M131.54,43.1h-5.08c.12,1.16.85,1.82,1.85,1.82.85,0,1.39-.4,1.67-1.03l1.37.47c-.44,1.08-1.56,1.78-3,1.78-2.02,0-3.43-1.4-3.43-3.43s1.48-3.43,3.39-3.43,3.26,1.39,3.26,3.31c0,.19-.01.39-.02.51ZM126.5,42.07h3.54c-.14-.97-.77-1.59-1.73-1.59-.9,0-1.6.57-1.8,1.59Z"/><path class="cls-1" d="M139.08,45.98h-1.55c-.17-.46-.23-.9-.23-1.37h-.12c-.34.93-1.16,1.53-2.19,1.53-1.37,0-2.37-1-2.37-2.74v-3.96h1.5v3.6c0,1.14.65,1.76,1.56,1.76s1.56-.62,1.56-1.76v-3.6h1.5v4.83c0,.62.11,1.15.34,1.71Z"/><path class="cls-1" d="M92.77,44.84c.34,0,.68-.11,1-.28v1.3c-.4.17-.9.25-1.27.25-1.45,0-2.26-.77-2.26-2.3v-3.22h-1.25v-1.17h1.25v-1.14l1.38-.68h.12v1.82h2.03v1.17h-2.03v3.1c0,.86.39,1.15,1.03,1.15Z"/></svg>`;

const BIEN_JOUER_LOGO_XML = `<?xml version="1.0" encoding="utf-8"?>
<!-- Generator: Adobe Illustrator 26.0.3, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
<svg version="1.1"
	 id="_x3C_Calque_x3E_" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:osb="http://www.openswatchbook.org/uri/2009/osb" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg"
	 xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 86.3 24.8"
	 style="enable-background:new 0 0 86.3 24.8;" xml:space="preserve">
<style type="text/css">
	.st0{fill:#fff;}
</style>
<g>
	<g>
		<path class="st0" d="M19.4,4.5c0.1,0.2,0.1,0.4,0.2,0.6c0,0.1,0.1,0.1,0.1,0c0.9-0.7,1.9-1,3.1-0.8c0,0,0.1,0,0-0.1
			c-0.4-0.4-0.8-0.8-1.2-1.2C20.5,2.3,19,3.4,19.4,4.5z M18.5,2.8C18.5,2.8,18.5,2.8,18.5,2.8c0.3-0.4,0.7-0.8,1.2-0.9
			c0,0,0-0.1,0-0.1c-0.3-0.2-0.7-0.4-1-0.5C18,1,17.6,1.7,18,2.2C18.2,2.4,18.3,2.6,18.5,2.8z M20.4,6.2c-0.5,0.2-0.8,0.6-0.9,1.1
			c0,0.3-0.1,0.5-0.2,0.9c0,0.1,0,0.1,0.1,0.1c2.1-0.9,4.3-0.5,5.9,1c0,0,0.1,0,0.1-0.1c-0.4-1.2-0.8-2.6-1.6-2.9
			C22.7,5.7,21.5,5.7,20.4,6.2z M22.8,9.9c-1.6-0.8-3.8-0.7-4.6,0.2c-0.2,0.3-0.5,0.6-0.8,0.8c0,0,0,0.1,0,0.1
			c1.6-0.2,3.3,0.2,4.7,1.2c1.7,1.3,2.5,3.4,2.2,5.5c0,0.1,0.1,0.1,0.1,0c0.6-1.1,0.9-2.1,1.1-3.3C26,12.6,24.7,10.8,22.8,9.9z
			 M14.4,0.3c0.8,0.1,1.6,0.4,2.3,0.8c0,0,0.1,0,0.1,0c0-0.1,0.1-0.3,0.2-0.4c0,0,0-0.1,0-0.1c-0.8-0.2-1.7-0.4-2.5-0.4
			C14.4,0.2,14.4,0.2,14.4,0.3C14.4,0.3,14.4,0.3,14.4,0.3z M16.3,12.3l-1.9,0c-0.1,0-0.1,0.1,0,0.1c3,0.4,5.3,2.9,5.3,6
			c0,3-2.3,5.6-5.2,6c0,0-0.1,0-0.1,0.1c0,0,0,0.1,0.1,0.1c3.6-0.3,8.1-2.2,8.1-6.4C22.6,14.9,19.6,12.3,16.3,12.3z M6.7,18.6
			c0.5-0.2,0.8-0.6,0.9-1.1c0-0.3,0.1-0.5,0.2-0.9c0-0.1,0-0.1-0.1-0.1c-2.1,0.9-4.3,0.5-5.9-1c0,0-0.1,0-0.1,0.1
			c0.4,1.2,0.8,2.6,1.6,2.9C4.3,19,5.6,19,6.7,18.6z M9.6,13.7c-1.6,0.2-3.3-0.2-4.7-1.2c-1.7-1.3-2.5-3.4-2.2-5.5
			c0-0.1-0.1-0.1-0.1,0C2,8,1.6,9,1.4,10.2c-0.3,1.9,0.9,3.7,2.8,4.6c1.6,0.8,3.8,0.7,4.6-0.2C9,14.3,9.3,14,9.6,13.8
			C9.7,13.7,9.6,13.7,9.6,13.7z M8.6,22C8.5,21.9,8.5,21.9,8.6,22c-0.3,0.4-0.7,0.8-1.2,0.9c0,0,0,0.1,0,0.1c0.3,0.2,0.7,0.4,1,0.5
			C9,23.8,9.5,23,9.1,22.6C8.9,22.4,8.7,22.2,8.6,22z M7.7,20.2c-0.1-0.2-0.1-0.4-0.2-0.6c0-0.1-0.1-0.1-0.1,0
			c-0.9,0.7-1.9,1-3.1,0.8c0,0-0.1,0,0,0.1c0.4,0.4,0.8,0.8,1.2,1.2C6.5,22.5,8,21.4,7.7,20.2z M12.6,24.4c-0.8-0.1-1.6-0.4-2.3-0.8
			c0,0-0.1,0-0.1,0c0,0.1-0.1,0.3-0.2,0.4c0,0,0,0.1,0,0.1c0.8,0.2,1.7,0.4,2.5,0.4C12.6,24.6,12.7,24.5,12.6,24.4
			C12.7,24.5,12.7,24.4,12.6,24.4z M12.7,12.3c-3-0.4-5.3-2.9-5.3-6c0-3,2.3-5.6,5.2-6c0,0,0.1,0,0.1-0.1c0,0,0-0.1-0.1-0.1
			C9,0.5,4.5,2.4,4.5,6.6c0,3.2,3,5.8,6.3,5.8l1.9,0C12.7,12.4,12.7,12.3,12.7,12.3z"/>
	</g>
	<path class="st0" d="M33.3,3.2h-1.5v8.1h4.9v-1.3h-3.5V3.2z M40.3,4.9c-1.8,0-3.2,1.4-3.2,3.3c0,1.9,1.4,3.3,3.2,3.3
		c1.8,0,3.2-1.4,3.2-3.3C43.5,6.3,42.1,4.9,40.3,4.9z M40.3,10.3c-1,0-1.8-0.8-1.8-2c0-1.3,0.8-2,1.8-2c1,0,1.8,0.8,1.8,2
		C42,9.5,41.3,10.3,40.3,10.3z M46.2,3.4h-0.1L44.8,4v1.1h-1.2v1.1h1.2v3.1c0,1.4,0.8,2.2,2.1,2.2c0.4,0,0.9-0.1,1.2-0.2V10
		c-0.3,0.2-0.6,0.3-1,0.3c-0.6,0-1-0.3-1-1.1v-3h1.9V5.1h-1.9V3.4z M51.7,4.9c-1.8,0-3.2,1.4-3.2,3.3c0,1.9,1.4,3.3,3.2,3.3
		c1.8,0,3.2-1.4,3.2-3.3C54.9,6.3,53.6,4.9,51.7,4.9z M51.7,10.3c-1,0-1.8-0.8-1.8-2c0-1.3,0.8-2,1.8-2c1,0,1.8,0.8,1.8,2
		C53.5,9.5,52.7,10.3,51.7,10.3z M35.4,13.2c-2.4,0-4.2,1.8-4.2,4.2s1.8,4.2,4.2,4.2c0.8,0,1.5-0.2,2.1-0.5l0.9,1.1l1-0.9l-0.9-1
		c0.7-0.7,1.1-1.8,1.1-2.9C39.5,15,37.8,13.2,35.4,13.2z M37.5,19.3l-0.9-1.1l-1,0.8l0.9,1c-0.3,0.2-0.7,0.3-1.2,0.3
		c-1.5,0-2.6-1.1-2.6-2.9s1.1-2.9,2.6-2.9c1.5,0,2.6,1.1,2.6,2.9C38,18.2,37.8,18.8,37.5,19.3z M44.8,18.7c0,1.1-0.6,1.7-1.5,1.7
		c-0.9,0-1.5-0.6-1.5-1.7v-3.4h-1.4V19c0,1.7,1,2.6,2.3,2.6c1,0,1.7-0.6,2.1-1.5h0.1l-0.1,1.3h1.4v-6.3h-1.4V18.7z M52.1,13.7
		l-0.4-1.1l-2.5,1.2l0.3,0.8L52.1,13.7z M50.4,15.1c-1.8,0-3.2,1.3-3.2,3.3s1.3,3.3,3.3,3.3c1.4,0,2.5-0.7,2.9-1.7L52,19.5
		c-0.3,0.6-0.8,1-1.6,1c-1,0-1.7-0.6-1.8-1.7h4.9c0-0.1,0-0.3,0-0.5C53.5,16.4,52.2,15.1,50.4,15.1z M48.6,17.8
		c0.2-1,0.9-1.5,1.7-1.5c0.9,0,1.5,0.6,1.7,1.5H48.6z M58,15.1c-1,0-1.8,0.6-2.2,1.6h-0.1l0.1-1.5v-2.1h-1.4v8.3h1.4L55.7,20h0.1
		c0.3,1,1.2,1.6,2.2,1.6c1.5,0,2.6-1.3,2.6-3.3C60.7,16.4,59.5,15.1,58,15.1z M57.5,20.4c-1,0-1.7-0.8-1.7-2s0.7-2,1.7-2
		c1,0,1.7,0.8,1.7,2S58.5,20.4,57.5,20.4z M64.6,15.1c-1.8,0-3.2,1.3-3.2,3.3s1.3,3.3,3.3,3.3c1.4,0,2.5-0.7,2.9-1.7l-1.3-0.5
		c-0.3,0.6-0.8,1-1.6,1c-1,0-1.7-0.6-1.8-1.7h4.9c0-0.1,0-0.3,0-0.5C67.7,16.4,66.4,15.1,64.6,15.1z M62.8,17.8
		c0.2-1,0.9-1.5,1.7-1.5c0.9,0,1.5,0.6,1.7,1.5H62.8z M73.2,19.2c-0.2,0.8-0.8,1.2-1.6,1.2c-1,0-1.8-0.8-1.8-2s0.8-2,1.8-2
		c0.8,0,1.4,0.4,1.6,1.2l1.4-0.4c-0.4-1.2-1.5-2-2.9-2c-1.9,0-3.3,1.4-3.3,3.3c0,1.9,1.4,3.3,3.3,3.3c1.4,0,2.6-0.8,3-2.1L73.2,19.2
		z"/>
</g>
</svg>`;

const CAROUSEL_DATA = [
    {
        id: '1',
        image: require('../../assets/carousel1.jpg'), 
        title: 'Lotto Max',
    },
    {
        id: '2',
        image: require('../../assets/carousel2.jpg'),
        title: 'Holiday Collection',
    },
    {
        id: '3',
        image: require('../../assets/carousel3.jpg'),
        title: 'Group Play',
    },
    {
        id: '4',
        image: require('../../assets/carousel4.jpg'),
        title: 'Celebration 2026',
    },
];

export default function LotoQuebecScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const mode = (route.params as any)?.mode || 'practice';
  
  const [currentView, setCurrentView] = useState<'landing' | 'login'>('landing');
  const [showWinnerPopup, setShowWinnerPopup] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showScamAlert, setShowScamAlert] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  // Guide step starts at 3 because steps 0-2 are in GmailScreen
  const [guideStep, setGuideStep] = useState(mode === 'guide' ? 3 : 1);

  const handleLoginNavigation = () => {
    setShowWinnerPopup(false);
    setCurrentView('login');
    if (mode === 'guide') {
      setGuideStep(5);
    }
  };

  const handleLoginSubmit = () => {
    if (email && password) {
        setShowScamAlert(true);
    } else {
        Alert.alert("Error", "Please enter your email and password");
    }
  };

  const handleFinishSimulation = () => {
    setShowScamAlert(false);
    navigation.navigate('Home' as never);
  };

  const renderHeader = () => (
    <View style={styles.header}>
        <SvgXml xml={BIEN_JOUER_LOGO_XML} width="100" height="40" />
        <View style={styles.headerRight}>
            {currentView === 'landing' && (
                <TouchableOpacity onPress={handleLoginNavigation}>
                    <Text style={styles.headerLoginText}>Login</Text>
                </TouchableOpacity>
            )}
            {currentView === 'landing' && (
                <TouchableOpacity style={styles.headerRegButton}>
                    <Text style={styles.headerRegText}>Registration</Text>
                </TouchableOpacity>
            )}
            {currentView === 'login' && (
                <TouchableOpacity onPress={() => setCurrentView('landing')}>
                    <Text style={styles.headerHelpText}>Help</Text>
                </TouchableOpacity>
            )}
        </View>
    </View>
  );

  const renderCarouselItem = ({ item }: any) => (
    <View style={styles.carouselItem}>
        <Image source={item.image} style={styles.carouselImage} resizeMode="cover" />
    </View>
  );

  const renderLanding = () => (
    <ScrollView style={styles.content}>
        {/* Navigation Bar */}
        <View style={styles.navBar}>
            <View style={styles.navItem}>
                <Ionicons name="ticket-outline" size={24} color="white" />
                <Text style={styles.navText}>LOTTERIES</Text>
            </View>
            <View style={styles.navItem}>
                <Ionicons name="game-controller-outline" size={24} color="#8FBCE6" />
                <Text style={[styles.navText, {color: '#8FBCE6'}]}>CASINO</Text>
            </View>
            <View style={styles.navItem}>
                <Ionicons name="football-outline" size={24} color="#8FBCE6" />
                <Text style={[styles.navText, {color: '#8FBCE6'}]}>SPORTS</Text>
            </View>
            <View style={styles.navItem}>
                <Ionicons name="flash-outline" size={24} color="#8FBCE6" />
                <Text style={[styles.navText, {color: '#8FBCE6'}]}>MOMENTS</Text>
            </View>
        </View>

        {/* Yellow Banner */}
        <View style={styles.yellowBanner}>
            <Text style={styles.yellowBannerText}>
                If you won between $600.01 and $50,000 or a gift in the Surprise Gift lottery, you can claim your prize online using our <Text style={{textDecorationLine: 'underline'}}>ticket checker</Text>.
            </Text>
        </View>

        {/* Carousel */}
        <View style={styles.carouselContainer}>
            <FlatList
                data={CAROUSEL_DATA}
                renderItem={renderCarouselItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / width);
                    setActiveIndex(index);
                }}
            />
            <View style={styles.pagination}>
                {CAROUSEL_DATA.map((_, index) => (
                    <View 
                        key={index} 
                        style={[
                            styles.paginationDot, 
                            index === activeIndex ? styles.paginationDotActive : null
                        ]} 
                    />
                ))}
            </View>
        </View>

        {/* Draw Results */}
        <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>DRAW RESULTS</Text>
            <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                    <Text style={styles.lottoName}>Lotto 6/49</Text>
                    <Ionicons name="chevron-down" size={24} color="black" />
                </View>
                <View style={styles.drawDateRow}>
                    <Ionicons name="time-outline" size={20} color="#333" />
                    <Text style={styles.drawDate}>NOVEMBER 29, 2025</Text>
                    <Text style={styles.superDraw}>SUPER DRAW</Text>
                </View>
                <View style={styles.lottoLogoContainer}>
                    <Image 
                        source={require('../../assets/logo649.png')}
                        style={styles.lotto649Logo}
                        resizeMode="contain"
                    />
                </View>
            </View>
        </View>
    </ScrollView>
  );

  const renderLogin = () => (
    <ScrollView contentContainerStyle={styles.loginScroll}>
        <View style={styles.loginContainer}>
            <Text style={styles.loginTitle}>Login</Text>
            <Text style={styles.loginSubtitle}>
                By logging in, you confirm that you are 18 years of age or older and that you reside in Quebec.
            </Text>

            <View style={styles.inputGroup}>
                <TextInput 
                    style={styles.input}
                    placeholder="Email or username*"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                />
            </View>

            <View style={styles.inputGroup}>
                <TextInput 
                    style={styles.input}
                    placeholder="Password*"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
                <Ionicons name="eye-outline" size={24} color="#666" style={styles.eyeIcon} />
            </View>

            <TouchableOpacity>
                <Text style={styles.forgotPassword}>Forgot your password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.continueButton} onPress={handleLoginSubmit}>
                <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>

            <View style={styles.signupRow}>
                <Text style={styles.noAccount}>No account? </Text>
                <TouchableOpacity>
                    <Text style={styles.signupLink}>Sign up</Text>
                </TouchableOpacity>
            </View>
        </View>

        <View style={styles.loginFooter}>
            <View style={styles.bienJouerContainer}>
                <SvgXml xml={LOTO_QUEBEC_LOGO_XML} width="120" height="50" />
            </View>
            <View style={styles.footerLinks}>
                <Text style={styles.footerLink}>Online game conditions</Text>
                <Text style={styles.footerLink}>Confidentiality</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.recaptcha}>
                Protected by reCAPTCHA. 2025, Loto-Québec and its subsidiaries. All rights reserved.
            </Text>
        </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
        {renderHeader()}
        
        {currentView === 'landing' ? renderLanding() : renderLogin()}

        {/* Guide Overlays */}
        {mode === 'guide' && guideStep === 3 && showWinnerPopup && (
          <GuideOverlay 
            text="You clicked the link and landed on a fake Loto-Québec site. This pop-up is trying to convince you that you've won money to get you excited."
            onNext={() => setGuideStep(4)}
            position="bottom"
          />
        )}

        {mode === 'guide' && guideStep === 4 && showWinnerPopup && (
          <GuideOverlay 
            text="Red flags: 1) You never entered this lottery. 2) Real lotteries don't notify via pop-ups. 3) They want you to 'login to claim' - credential theft!"
            onNext={() => {
              setShowWinnerPopup(false);
              setCurrentView('login');
              setGuideStep(5);
            }}
            position="bottom"
          />
        )}

        {mode === 'guide' && guideStep === 5 && currentView === 'login' && (
          <GuideOverlay 
            text="This fake login page looks convincing. If you enter your real credentials here, scammers will steal them and try to access your real accounts."
            onNext={() => setGuideStep(6)}
            position="top"
          />
        )}

        {mode === 'guide' && guideStep === 6 && currentView === 'login' && (
          <GuideOverlay 
            text="REMEMBER: 1) Never click prize links in emails. 2) You can't win a lottery you didn't enter. 3) Always verify URLs before logging in."
            onNext={() => navigation.navigate('Home' as never)}
            position="center"
          />
        )}

        {/* Winner Popup */}
        <Modal
            animationType="fade"
            transparent={true}
            visible={showWinnerPopup && currentView === 'landing'}
            onRequestClose={() => setShowWinnerPopup(false)}
        >
            <View style={styles.popupOverlay}>
                <View style={styles.popupContent}>
                    <TouchableOpacity 
                        style={styles.closeButton} 
                        onPress={() => setShowWinnerPopup(false)}
                    >
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                    
                    <View style={styles.popupHeader}>
                        <Ionicons name="trophy" size={50} color="#FFD700" />
                        <Text style={styles.popupTitle}>CONGRATULATIONS!</Text>
                    </View>
                    
                    <Text style={styles.popupText}>
                        You have been selected as a winner in our monthly customer appreciation draw!
                    </Text>
                    
                    <Text style={styles.prizeText}>$2,500.00</Text>
                    
                    <Text style={styles.popupSubText}>
                        Please login to your account to claim your prize immediately.
                    </Text>

                    <TouchableOpacity style={styles.popupLoginButton} onPress={handleLoginNavigation}>
                        <Text style={styles.popupLoginButtonText}>Login to Claim</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

        {/* Scam Alert Modal */}
        <Modal
            animationType="slide"
            transparent={true}
            visible={showScamAlert}
            onRequestClose={handleFinishSimulation}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Ionicons name="warning" size={40} color="#E31837" />
                        <Text style={styles.modalTitle}>Scam Detected!</Text>
                    </View>
                    <Text style={styles.modalText}>
                        You just fell for a <Text style={{fontWeight: 'bold'}}>Lottery Prize Claim Scam</Text>.
                    </Text>
                    <Text style={styles.modalText}>
                        1. <Text style={{fontWeight: 'bold'}}>The Pop-up:</Text> Legitimate lotteries never use pop-ups to announce major wins. You must check your own ticket.
                    </Text>
                    <Text style={styles.modalText}>
                        2. <Text style={{fontWeight: 'bold'}}>The Website:</Text> This fake site looks like Loto-Québec but the URL would be suspicious (e.g., loto-quebec-winner.com).
                    </Text>
                    <Text style={styles.modalText}>
                        3. <Text style={{fontWeight: 'bold'}}>The Login:</Text> Scammers now have your credentials. They can access your real account or try these on other sites.
                    </Text>
                    <Text style={styles.modalText}>
                        4. <Text style={{fontWeight: 'bold'}}>Remember:</Text> You can't win a lottery you never entered!
                    </Text>
                    <TouchableOpacity style={styles.modalButton} onPress={handleFinishSimulation}>
                        <Text style={styles.modalButtonText}>I Understand</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#003366', // Dark Blue
    height: 60,
  },
  logo: {
    width: 100,
    height: 40,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLoginText: {
    color: '#fff',
    fontSize: 16,
    marginRight: 15,
    fontWeight: 'bold',
  },
  headerRegButton: {
    
  },
  headerRegText: {
    color: '#8FBCE6',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerHelpText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#004080',
    paddingVertical: 15,
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 5,
  },
  yellowBanner: {
    backgroundColor: '#FFD100',
    padding: 15,
  },
  yellowBannerText: {
    color: '#003366',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Carousel
  carouselContainer: {
    height: 200,
    backgroundColor: '#ddd',
  },
  carouselItem: {
    width: width,
    height: 200,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: 'white',
  },
  // Results
  resultsSection: {
    padding: 20,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#003366',
    textAlign: 'center',
    marginBottom: 15,
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    borderWidth: 2,
    borderColor: '#000',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  lottoName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  drawDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 5,
    marginBottom: 15,
  },
  drawDate: {
    marginLeft: 5,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  superDraw: {
    color: 'red',
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  lottoLogoContainer: {
    alignItems: 'center',
    padding: 10,
  },
  lotto649Logo: {
    width: 100,
    height: 60,
  },
  // Login Styles
  loginScroll: {
    flexGrow: 1,
    backgroundColor: 'white',
  },
  loginContainer: {
    padding: 25,
    backgroundColor: 'white',
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 15,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 25,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 15,
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#003366',
    borderRadius: 5,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  forgotPassword: {
    color: '#003366',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    marginBottom: 25,
  },
  continueButton: {
    backgroundColor: '#003366',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  noAccount: {
    fontSize: 16,
    color: '#333',
  },
  signupLink: {
    fontSize: 16,
    color: '#003366',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  // Login Footer
  loginFooter: {
    backgroundColor: '#F4F8FB',
    padding: 20,
    alignItems: 'center',
    marginTop: 'auto',
  },
  bienJouerContainer: {
    marginBottom: 15,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  footerLink: {
    color: '#003366',
    fontWeight: 'bold',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    width: '100%',
    marginBottom: 15,
  },
  recaptcha: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  // Popup Styles
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContent: {
    backgroundColor: 'white',
    width: '85%',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
  popupHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  popupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003366',
    marginTop: 10,
    textAlign: 'center',
  },
  popupText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    marginBottom: 15,
  },
  prizeText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#E31837',
    marginBottom: 15,
  },
  popupSubText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  popupLoginButton: {
    backgroundColor: '#E31837',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  popupLoginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Modal Styles (Reused)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E31837',
    marginTop: 10,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    textAlign: 'left',
    width: '100%',
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#E31837',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
