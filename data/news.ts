

export interface NewsItem {
  id: string;
  image: string;
  title: string;
  date: string;
  url: string;
  category: 'National' | 'International' | 'Womens' | 'Schools';
  summary: string;
  content: string;
}

export const newsData: NewsItem[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1540744233412-f0c6c7a13c2f?auto=format&fit=crop&w=800&q=80',
    title: 'Highlanders Secure a Dramatic Last-Minute Victory',
    date: 'October 26, 2023',
    url: '/news/highlanders-dramatic-victory',
    category: 'National',
    summary: 'A thrilling conclusion at Somhlolo Stadium sees Mbabane Highlanders snatch a win in stoppage time against rivals Manzini Wanderers.',
    content: "The Mbabane derby lived up to its fiery reputation, with a capacity crowd at Somhlolo National Stadium witnessing a dramatic finale. Manzini Wanderers looked set to secure a valuable point after an 80th-minute equalizer cancelled out Highlanders' first-half lead.\n\nHowever, in the fourth minute of added time, Highlanders' striker Kenneth Moloto found the back of the net with a stunning volley from the edge of the box, sending the home supporters into a frenzy. The 2-1 victory propels Highlanders to the top of the MTN Premier League table."
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1521412644187-c49fa049e8be?auto=format&fit=crop&w=800&q=80',
    title: 'Swallows Unveil New Talent for the Upcoming Season',
    date: 'October 25, 2023',
    url: '/news/swallows-unveil-talent',
    category: 'National',
    summary: 'Mbabane Swallows presented three new signings today, bolstering their squad as they aim to reclaim the Premier League title.',
    content: "Mbabane Swallows have sent a clear message of intent to their rivals by unveiling three major signings at a press conference held at the club's headquarters. The new additions include a star midfielder from Zambia, a promising young defender from the national U-20 squad, and a seasoned striker returning to the league after a stint in South Africa.\n\nClub chairman, Bishop Bheki Lukhele, expressed his excitement, stating, 'We are building a team not just to compete, but to dominate. These players bring quality and experience, and we are confident they will help us achieve our goal of winning the championship this season.'"
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80',
    title: 'AFCON Qualifiers: Sihlangu Semnikati Gears Up for Tough Away Match',
    date: 'October 24, 2023',
    url: '/news/sihlangu-gears-up',
    category: 'National',
    summary: 'The Eswatini national team is in high spirits as they travel to face Nigeria in a crucial Africa Cup of Nations qualifier this weekend.',
    content: "Sihlangu Semnikati departed for Abuja today with a sense of optimism ahead of their critical AFCON qualifier against the Super Eagles of Nigeria. Head coach Dominic Kunene has emphasized a disciplined, defensive strategy, hoping to frustrate the hosts and capitalize on counter-attacking opportunities.\n\n'We know we are the underdogs, but in football, anything is possible,' Kunene told reporters before boarding. 'The players are motivated and ready to fight for the nation. A positive result here would be a massive boost for our campaign.'"
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1551958214-2d58ccb33587?auto=format&fit=crop&w=800&q=80',
    title: 'Champions League: Manchester United Stun Bayern Munich',
    date: 'October 26, 2023',
    url: '/news/man-u-stuns-bayern',
    category: 'International',
    summary: 'A surprising turn of events at Old Trafford as Manchester United pulls off an unexpected 2-1 victory against the German giants.',
    content: "In a shocking night at Old Trafford, Manchester United secured a memorable 2-1 victory over European giants Bayern Munich. Despite Bayern dominating possession, United's counter-attacking strategy paid off, with two second-half goals from their young forwards.\n\nThis result puts United in a strong position to qualify from their group, a feat that seemed unlikely just a few weeks ago. The manager praised the team's resilience and tactical discipline in his post-match comments."
  },
  {
    id: '5',
    image: 'https://images.unsplash.com/photo-1614632537190-23e4142776fd?auto=format&fit=crop&w=800&q=80',
    title: 'Messi Guides Inter Miami to Another Final',
    date: 'October 25, 2023',
    url: '/news/messi-inter-miami',
    category: 'International',
    summary: 'Lionel Messi continues his magical run in the MLS, scoring two goals to send Inter Miami into the US Open Cup final.',
    content: "Lionel Messi's incredible impact on American soccer continues as he scored two sensational free-kicks to lead Inter Miami to the US Open Cup final. His performance left fans and pundits alike in awe of his enduring genius.\n\nThe final will see Inter Miami face off against Houston Dynamo, with Messi looking to add another trophy to his already legendary career."
  },
  {
    id: '6',
    image: 'https://images.unsplash.com/photo-1558521458-8535a39207de?auto=format&fit=crop&w=800&q=80',
    title: 'Young Buffaloes Coach Talks Strategy for CAF Cup',
    date: 'October 23, 2023',
    url: '/news/buffaloes-caf-cup',
    category: 'National',
    summary: 'The Young Buffaloes head coach outlined his tactical approach for the upcoming CAF Confederations Cup match.',
    content: "Ahead of their crucial CAF Confederations Cup second-leg tie, Young Buffaloes' head coach laid out his game plan in a press conference. Emphasizing a solid defensive foundation, he stated the team would look to exploit their opponents on the break.\n\n'We have a slight advantage from the first leg, but we cannot be complacent,' he said. 'The team is focused, and we know what we need to do to progress to the next round of this prestigious competition.'"
  }
];