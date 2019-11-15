// @flow

import { Box, GridList, GridListTile, Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';
import React, { Component } from 'react';

import Stars from '../Stars';

const styles = (theme) => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    fontFamily: '"Libre Baskerville", Helvetica, Roboto, sans-serif',

    '& .MuiTypography-root': {
      fontSize: 13,
      fontFamily: '"Libre Baskerville", Helvetica, Roboto, sans-serif',
    },
  },
  gridList: {},
  gridTile: {
    height: 'auto !important',
  },
  gridTileBox: {
    border: '2px solid #e6e6e6',
  },
  verifiedPurchase: {
    color: '#b19440',
    fontWeight: 'bold',
  },
  stars: {
    margin: theme.spacing(1, 0),
  },
  body: {
    fontSize: 15,
    fontWeight: 500,
    lineHeight: 1.2,
  },
});

type Props = {
  classes: Object,
  width: number,
};

type State = {
  testimonials: Array<Object>,
};

class Testimonials extends Component<Props, State> {
  constructor() {
    super();

    this.state = {
      testimonials: [
        {
          author: 'Paul',
          rating: 5,
          content: [
            `“It’s so good to have this great community. It’s exciting to be renewing the mind with Graham and friends. What I love about Brilliant TV is that I feel like I am getting to know more about the radical love of God as I keep listening and sowing this into my life.”`,
            `- Paul F.`,
          ],
        },
        {
          author: 'Jennifer',
          rating: 5,
          content: [
            `“I can't say enough about the importance of being mentored in the truth like this! I have been a Christian for 13 years but I spent 10 of those years having an identity crisis that had me miserable. I just knew there had to be more. Praise God there is!”`,
          ],
        },
        {
          author: 'Mary',
          rating: 5,
          content: [
            `“I am personally immersing myself in the content of BTV and growing and changing so much. I am constantly sharing applied content with individuals and classes I teach at my church.”`,
          ],
        },
        {
          author: 'Jim',
          rating: 5,
          content: [
            `“Up until two years ago I had no concept of the kingdom. My church and seminary both treated it as if it was something to come later. One day as a brand new pastor I asked the Holy Spirit to reveal the truth about His word and the gospel. He immediately began to teach about the Kingdom and put teachers in my life who were immensely helpful in creating a Kingdom worldview. What Brilliant TV has blessed me with are the tools to live according to the Kingdom and the Father’s amazing destiny for me.”`,
          ],
        },
        {
          author: 'McClendon',
          rating: 5,
          content: [
            `“I have been praying for a mentor, and so when I signed on with Brilliant TV just a few days ago, I went directly to the Mentor Series. Let me just say that God has opened a window and offered a word that is nourishing the hunger in my soul. And the crafted prayer you gave us at the end of this week's teaching has already been life transforming to me. Yes, I have walked with the Lord a very long time, but in these last few days, I have known Him as a very close and present friend.”`,
          ],
        },
        {
          author: 'Mary',
          rating: 5,
          content: [
            `“I am personally immersing myself in the content of BTV and growing and changing so much. I am constantly sharing applied content with individuals and classes I teach at my church.” `,
          ],
        },
      ],
    };
  }

  getGridListCols = (width) => {
    if (isWidthUp('lg', width)) {
      return 3;
    }
    if (isWidthUp('sm', width)) {
      return 2;
    }
    return 1;
  };

  render() {
    const { classes: c, width } = this.props;
    const { testimonials } = this.state;

    return (
      <Box align="left" className={c.root}>
        <GridList cols={this.getGridListCols(width)} spacing={20} className={c.gridList}>
          {testimonials.map((testimonial, i) => (
            <GridListTile className={c.gridTile} key={i}>
              <Box padding={1} className={c.gridTileBox}>
                <Typography>
                  <b>{testimonial.author}</b> | <i>Brilliant TV Subscriber</i>
                </Typography>
                <Typography className={c.verifiedPurchase}>Verified Purchase</Typography>
                <Stars className={c.stars} />
                <Typography className={c.body}>
                  {testimonial.content.map((line, j) => (
                    <span key={j}>
                      {j > 0 && <br />}
                      {line}
                    </span>
                  ))}
                </Typography>
              </Box>
            </GridListTile>
          ))}
        </GridList>
      </Box>
    );
  }
}

export default withStyles(styles, { withTheme: true })(withWidth()(Testimonials));
