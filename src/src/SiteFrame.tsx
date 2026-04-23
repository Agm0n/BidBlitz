import { useContext, useState, type PropsWithChildren } from "react"

/// Header for the title and logo of the site and also a theme toggle button
const SiteFrame: React.FC<PropsWithChildren> = ({children}) => {
    const [currRender, Rerender] = useState(false)

    const primaryColor: string = "rgba(130, 130, 135, 0.3)";

    const styles = {
        titleBar: {
            display: "flex",
            height: "3rem",
            backgroundColor: primaryColor,
            borderBottom: "2px solid " + primaryColor,
            borderBottomLeftRadius: "0.5rem",
            borderBottomRightRadius: "0.5rem",
            justifyContent: "center",
            alignItems: "center"
        },
        title: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: "fit-content",
            width: "fit-content",
            borderRadius: "12px",
            backgroundColor: "rgba(140, 140, 145, 0.25)",
            border: "2px solid " + primaryColor,
            padding: "0.5rem",
            gap: "0.25rem"
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
            <div id="Title" style={styles.title}>
                <h3 style={{margin: 0}}>🔨</h3>
                <h3 style={{margin: 0}}>Bid Blitz</h3>
            </div>
            <div id="themeButton" style={styles.themeButton} title="Change theme"
                onClick={() => {
                    document.body.className = document.body.className === "light" ? "dark" : "light";
                    Rerender(!currRender);
                }}>
                {document.body.className === "light"?
                //  Moon Icon
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454l0 .008" />
                </svg>
                 :
                //  Sun Icon 
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
                    <path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" />
                </svg>
                }
            </div>
        </div>
        <div id="Content" style={{margin: "8px"}}>
            {children}
        </div>
    </>
  )
}
export default SiteFrame