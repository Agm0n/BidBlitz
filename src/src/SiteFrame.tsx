import { useState, type PropsWithChildren } from "react"
import { primaryColor } from "./App"

/// Header for the title and logo of the site and also a theme toggle button
const SiteFrame: React.FC<PropsWithChildren> = ({children}) => {
    // const [currRender, Rerender] = useState(false);
    // const [theme,setCookieValue] = useCookies('theme');

    const styles = {
        titleBar: {
            display: "flex",
            height: "3rem",
            backgroundColor: primaryColor.replace("0.3", "0.2"),
            borderBottom: "2px solid " + primaryColor,
            borderBottomLeftRadius: "0.5rem",
            borderBottomRightRadius: "0.5rem",
            justifyContent: "flex-start",
            alignItems: "center"
        },
        title: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: "fit-content",
            width: "fit-content",
            borderRadius: "12px",
            // backgroundColor: "rgba(140, 140, 145, 0.25)",
            // border: "2px solid " + primaryColor,
            padding: "0.5rem",
            gap: "0.25rem",
            cursor: "pointer"
        },
        themeButton: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "absolute",
            right: "1rem",
            cursor: "pointer",
            transition: "0.2s ease-in-out",
        }
    } 


  return (
    <>
        <div id="TitleBar" style={styles.titleBar}>
            <div id="Title" style={styles.title} onClick={() => window.location.href = "/"}>
                <h3 style={{margin: 0}}>🔨</h3>
                <h3 style={{margin: 0}}>Bid Blitz</h3>
            </div>
            {/* <div id="themeButton" style={styles.themeButton as React.CSSProperties} title="Change theme"
                onClick={() => {
                    let newTheme = theme === "light" ? "dark" : "light";
                    
                    document.body.className = newTheme;
                    setCookieValue(newTheme);
                    Rerender(!currRender);
                }}>
                {document.body.className === "light"?
                //  Moon Icon
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454l0 .008" />
                </svg>
                 :
                //  Sun Icon 
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
                    <path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" />
                </svg>
                }
            </div> */}
        </div>
        <div id="Content" style={{margin: "8px"}}>
            {children}
        </div>
    </>
  )
}
export default SiteFrame