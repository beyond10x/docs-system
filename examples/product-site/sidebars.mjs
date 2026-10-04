export default {
  docs: [
    {type: 'doc', id: 'index', label: 'Components'},
    {
      type: 'category',
      label: 'Showcase',
      collapsible: false,
      items: [
        {type: 'doc', id: 'charts', label: 'Charts'},
        {type: 'doc', id: 'meaning', label: 'Meaning in docs'},
        {type: 'doc', id: 'code', label: 'Code blocks'},
        {type: 'doc', id: 'art', label: 'Hero art'},
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      collapsible: false,
      items: [
        {type: 'doc', id: 'reference', label: 'Reference page'},
        {type: 'doc', id: 'status', label: 'Status'},
      ],
    },
    {type: 'doc', id: 'adopt', label: 'Adopt the template'},
  ],
};
