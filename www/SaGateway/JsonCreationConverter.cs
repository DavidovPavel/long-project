﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace www.SaGateway
{
    /// <summary>
    /// Base Generic JSON Converter that can help quickly define converters for specific types by automatically
    /// generating the CanConvert, ReadJson, and WriteJson methods, requiring the implementer only to define a strongly typed Create method.
    /// </summary>
    public abstract class JsonCreationConverter<T> : JsonConverter
    {
        /// <summary>
        /// this is very important, otherwise serialization breaks!
        /// </summary>
        public override bool CanWrite
        {
            get
            {
                return false;
            }
        }

        /// <summary> 
        /// Create an instance of objectType, based properties in the JSON object 
        /// </summary> 
        /// <param name="objectType">type of object expected</param> 
        /// <param name="jObject">contents of JSON object that will be 
        /// deserialized</param> 
        /// <returns></returns> 
        protected abstract T Create(Type objectType, JObject jObject);

        /// <summary>Determines if this converted is designed to deserialization to objects of the specified type.</summary>
        /// <param name="objectType">The target type for deserialization.</param>
        /// <returns>True if the type is supported.</returns>
        public override bool CanConvert(Type objectType)
        {
            return typeof(T).IsAssignableFrom(objectType);
        }

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            if (reader.TokenType == JsonToken.Null) return null;

            // Load JObject from stream 
            JObject jObject = JObject.Load(reader);

            // Create target object based on JObject 
            T target = Create(objectType, jObject);

            //Create a new reader for this jObject, and set all properties to match the original reader.
            JsonReader jObjectReader = jObject.CreateReader();
            jObjectReader.Culture = reader.Culture;
            jObjectReader.DateParseHandling = reader.DateParseHandling;
            jObjectReader.DateTimeZoneHandling = reader.DateTimeZoneHandling;
            jObjectReader.FloatParseHandling = reader.FloatParseHandling;

            // Populate the object properties 
            serializer.Populate(jObject.CreateReader(), target);

            return target;
        }

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            serializer.Serialize(writer, value);
        }

        protected bool FieldExists(string fieldName, JObject jObject)
        {
            return jObject[fieldName] != null;
        }
    }
}