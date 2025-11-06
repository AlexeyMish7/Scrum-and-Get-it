import { responsiveFontSizes } from "@mui/material/styles";
import createThemeFromTokens from "./factory";
import darkPaletteTokens from "./darkPalette";

let theme = createThemeFromTokens(darkPaletteTokens);
theme = responsiveFontSizes(theme);
export default theme;
